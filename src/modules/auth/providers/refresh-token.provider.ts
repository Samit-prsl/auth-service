import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { calculateExpiry } from "src/common/utils/calculateExpiry.utils";

@Injectable()
export class RefreshTokenProvider {
  private readonly logger = new Logger(RefreshTokenProvider.name);

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

      this.logger.debug(`Stored refresh token for employee ${employeeId}`);
      return result.refreshToken;
    } catch (error) {
      this.logger.error(`Failed to store refresh token for employee ${employeeId}`, error.stack);
      throw new InternalServerErrorException("Failed to store refresh token");
    }
  }


  async findRefreshToken(token: string) {
    return this.prisma.refreshToken.findUnique({
      where: { refreshToken: token },
    });
  }

  async revokeRefreshToken(token: string) {
    this.logger.debug(`Revoking refresh token`);
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

      this.logger.debug(`Updated refresh token for employee ${employeeId}`);
    } catch (error) {
      this.logger.error(`Failed to update refresh token for employee ${employeeId}`, error.stack);
      throw new InternalServerErrorException("Unable to update token, Please retry");
    }
  }
}
