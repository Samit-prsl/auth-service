import { Controller, Post, Body, Res, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { setRefreshTokenCookie } from 'src/common/utils/setRefreshTokenCookie.utils';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns access token and sets refresh token cookie' })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  public async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    setRefreshTokenCookie(res, refreshToken, this.configService.get<string>('NODE_ENV') === 'production', this.configService.get<string>('REFRESH_TOKEN_TTL')!);
    return { accessToken };
  }

  @Public()
  @Post('refresh-token')
  @ApiCookieAuth('refresh_token')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Refresh token missing, expired, or revoked' })
  public async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refresh_token = req.cookies?.['refresh_token'];
    if (!refresh_token) {
      throw new UnauthorizedException('Token not found');
    }
    const { accessToken, refreshToken } = await this.authService.refreshTokens(refresh_token);
    setRefreshTokenCookie(res, refreshToken, this.configService.get<string>('NODE_ENV') === 'production', this.configService.get<string>('REFRESH_TOKEN_TTL')!);
    return { accessToken };
  }
}
