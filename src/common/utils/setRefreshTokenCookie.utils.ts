import { Response } from 'express';
import { parseMaxAge } from './calculateExpiry.utils';

export function setRefreshTokenCookie(res: Response, refreshToken: string, isProduction: boolean, refreshTtl: string) {
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: parseMaxAge(refreshTtl),
  });
}
