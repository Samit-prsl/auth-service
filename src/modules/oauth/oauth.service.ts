import { Injectable, InternalServerErrorException, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { EmployeeService } from '../employee/employee.service';
import { GenerateTokensProvider } from '../auth/providers/generate-token.provider';
import { ConfigService } from '@nestjs/config';
import { GoogleTokenDto } from './dto/googleToken.dto';
import { RefreshTokenProvider } from '../auth/providers/refresh-token.provider';

@Injectable()
export class OauthService implements OnModuleInit {
    private oAuthClient: OAuth2Client
    private readonly logger = new Logger(OauthService.name);

    constructor(
        private readonly employeeService: EmployeeService,
        private readonly generateTokensProvider: GenerateTokensProvider,
        private readonly refreshTokenProvider: RefreshTokenProvider,
        private readonly configService: ConfigService,
    ){}

    onModuleInit() {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID')
        const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET')
        this.oAuthClient = new OAuth2Client(clientId,clientSecret)
        this.logger.log('OAuth2 client initialized');
    }

    public async authenticate(googleToken: GoogleTokenDto){
        try {
            const loginTicket = await this.oAuthClient.verifyIdToken({idToken: googleToken.token})
            const payload = loginTicket.getPayload()

            if(!payload?.email || !payload.sub){
                this.logger.warn('Google token payload missing email or sub');
                throw new UnauthorizedException('Invalid Google token payload')
            }

            const { email, sub: googleId, given_name: firstName,family_name: lastName } = payload;

            let emp = await this.employeeService.getEmployeeByGoogleId(googleId)

            if(!emp){
                this.logger.log(`New Google user: ${email}, creating account`);
                emp = await this.employeeService.createGoogleAuthenticatedEmployee({
                    email,
                    name: `${firstName} ${lastName}`.trim(),
                    googleId,
                })
            }

            const {accessToken,refreshToken} = await this.generateTokensProvider.generateTokens(emp)
            await this.refreshTokenProvider.storeRefreshToken(refreshToken,emp.id)
            this.logger.log(`Google auth successful for ${email}`);
            return {accessToken , refreshToken}

        } catch (error) {
            this.logger.error('Google authentication failed', error.stack);
            throw new InternalServerErrorException('Internal server error while authenticating employee')
        }
    }
}
