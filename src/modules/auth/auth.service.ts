import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { GenerateTokensProvider } from './providers/generate-token.provider';
import { RefreshTokenProvider } from './providers/refresh-token.provider';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generateTokensProvider: GenerateTokensProvider,
    private readonly refreshTokenProvider: RefreshTokenProvider,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email },
    });

    if (!existingEmployee) {
      throw new BadRequestException('Email is not registered');
    }

    const isPasswordValid = await bcrypt.compare(password, existingEmployee.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Email or password is wrong');
    }

    const { accessToken, refreshToken } = await this.generateTokensProvider.generateTokens(existingEmployee);

    await this.refreshTokenProvider.storeRefreshToken(refreshToken, existingEmployee.id);

    return { accessToken, refreshToken };
  }

  async refreshTokens(token: string) {

    const storedToken = await this.refreshTokenProvider.findRefreshToken(token);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (new Date() > storedToken.expiry) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: storedToken.employeeId },
    });

    if (!employee || employee.isDeleted) {
      throw new UnauthorizedException('Employee not found');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokensProvider.generateTokens(employee);

    await this.refreshTokenProvider.updateRefreshToken(
      storedToken.id,
      newRefreshToken,
      employee.id,
    );

    return { accessToken, refreshToken: newRefreshToken };
  }
}
