import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

interface EmployeeTokenPayload {
  id: string;
  tenantId: string;
  email: string | null;
  roleId?: string;
  roleName?: string[];
}

@Injectable()
export class GenerateTokensProvider {
  private readonly logger = new Logger(GenerateTokensProvider.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  public async signToken(
    userId: string,
    expiresIn: string,
    payload?: any
  ) {
    try {
      return await this.jwtService.signAsync(
        {
          sub: userId,
          ...payload,
        },
        { expiresIn: expiresIn as any }
      );
    } catch (error) {
      this.logger.error(`Failed to generate token for user ${userId}`, error.stack);
      throw new InternalServerErrorException(
        "Failed to generate token"
      );
    }
  }

  public async generateTokens(employee: EmployeeTokenPayload) {
    this.logger.debug(`Generating tokens for employee ${employee.id}`);
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(
        employee.id,
        this.configService.get<string>("ACCESS_TOKEN_TTL") as string,
        {
          employeeId: employee.id,
          tenantId: employee.tenantId,
          roleId: employee.roleId,
          roleName: employee.roleName ?? [],
          email: employee.email,
        }
      ),

      this.signToken(
        employee.id,
        this.configService.get<string>("REFRESH_TOKEN_TTL")!
      ),
    ]);

    return {accessToken, refreshToken};
  }
}