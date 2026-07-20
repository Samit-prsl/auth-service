import {
  Injectable,
  InternalServerErrorException,
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
      console.log("error : ",error)
      throw new InternalServerErrorException(
        "Failed to generate token"
      );
    }
  }

  public async generateTokens(employee: EmployeeTokenPayload) {
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