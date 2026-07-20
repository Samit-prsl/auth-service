import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { calculateExpiry } from "src/common/utils/calculate-expiry.utils";

@Injectable()
export class RefreshTokenProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async storeRefreshToken(refreshToken: string, employeeId: string) {
    try {
      const refreshTtl = this.configService.get<string>("REFRESH_TOKEN_TTL")!;
      const expiry = calculateExpiry(refreshTtl);

      const result = await this.prisma.refreshToken.create({
        data: {
          refreshToken,
          employeeId,
          expiry,
        },
      });

      return result.refreshToken;
    } catch (error) {
      throw new InternalServerErrorException("Failed to store refresh token");
    }
  }


  async findRefreshToken(token: string) {
    return this.prisma.refreshToken.findUnique({
      where: { refreshToken: token },
    });
  }

  async revokeRefreshToken(token: string) {
    return this.prisma.refreshToken.updateMany({
      where: { refreshToken: token },
      data: { revoked: true },
    });
  }

  async updateRefreshToken(tokenId: string, newRefreshToken: string, employeeId: string) {
    try {
      const refreshTtl = this.configService.get<string>("REFRESH_TOKEN_TTL")!;
      const expiry = calculateExpiry(refreshTtl);

      await this.prisma.$transaction(async (tx) => {
        await tx.refreshToken.update({
          where: { id: tokenId },
          data: { revoked: true },
        });

        await tx.refreshToken.create({
          data: {
            refreshToken: newRefreshToken,
            employeeId,
            expiry,
          },
        });
      });
    } catch (error) {
      throw new InternalServerErrorException("Unable to update token, Please retry");
    }
  }
}
