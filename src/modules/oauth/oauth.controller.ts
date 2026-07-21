import { Body, Controller, Post, Res } from '@nestjs/common';
import { OauthService } from './oauth.service';
import { GoogleTokenDto } from './dto/googleToken.dto';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { setRefreshTokenCookie } from 'src/common/utils/setRefreshTokenCookie.utils';

@Public()
@Controller('oauth')
export class OauthController {
    constructor(
        private readonly oauthService: OauthService,
        private readonly configService: ConfigService,
    ){}

    @Post()
    public async authenticate(
        @Body() googleToken: GoogleTokenDto,
        @Res({ passthrough: true }) res: Response,
    ){
        const {accessToken,refreshToken} = await this.oauthService.authenticate(googleToken)
        setRefreshTokenCookie(res, refreshToken, this.configService.get<string>('NODE_ENV') === 'production', this.configService.get<string>('REFRESH_TOKEN_TTL')!);
        return { accessToken }
    }
}
