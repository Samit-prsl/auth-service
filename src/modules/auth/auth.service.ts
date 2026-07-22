import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { GenerateTokensProvider } from './providers/generate-token.provider';
import { RefreshTokenProvider } from './providers/refresh-token.provider';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
      this.logger.warn(`Login failed: email ${email} not found`);
      throw new BadRequestException('Email is not registered');
    }

    const isPasswordValid = await bcrypt.compare(password, existingEmployee?.password!);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed: invalid password for ${email}`);
      throw new BadRequestException('Email or password is wrong');
    }

    const { accessToken, refreshToken } = await this.generateTokensProvider.generateTokens(existingEmployee);

    await this.refreshTokenProvider.storeRefreshToken(refreshToken, existingEmployee.id);

    this.logger.log(`User ${email} logged in successfully`);
    return { accessToken, refreshToken };
  }

  async refreshTokens(token: string) {

    const storedToken = await this.refreshTokenProvider.findRefreshToken(token);

    if (!storedToken) {
      this.logger.warn('Refresh failed: invalid token');
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revoked) {
      this.logger.warn('Refresh failed: token revoked');
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (new Date() > storedToken.expiry) {
      this.logger.warn('Refresh failed: token expired');
      throw new UnauthorizedException('Refresh token has expired');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: storedToken.employeeId },
    });

    if (!employee || employee.isDeleted) {
      this.logger.warn(`Refresh failed: employee ${storedToken.employeeId} not found`);
      throw new UnauthorizedException('Employee not found');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokensProvider.generateTokens(employee);

    await this.refreshTokenProvider.updateRefreshToken(
      storedToken.id,
      newRefreshToken,
      employee.id,
    );

    this.logger.log(`Tokens refreshed for employee ${employee.id}`);
    return { accessToken, refreshToken: newRefreshToken };
  }
}
