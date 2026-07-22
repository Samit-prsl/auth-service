import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
    private readonly logger = new Logger(TenantService.name);

    constructor(
        private readonly prisma: PrismaService
    ){}

    public async createTenant(){
        try {
            const tenant = await this.prisma.tenant.create({
                data: {
                    name: null,
                    branch: null,
                }
            })
            this.logger.log(`Tenant created: ${tenant.id}`);
            return tenant
        } catch (error) {
            this.logger.error('Failed to create tenant', error.stack);
            throw new InternalServerErrorException('Internal server error while, creating tenant')
        }
    }
}
