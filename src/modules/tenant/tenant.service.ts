import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
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
            return tenant
        } catch (error) {
            throw new InternalServerErrorException('Internal server error while, creating tenant')
        }
    }
}
