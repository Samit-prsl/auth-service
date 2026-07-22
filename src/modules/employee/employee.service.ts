import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleUser } from './interface/GoogleUser';

@Injectable()
export class EmployeeService {
    private readonly logger = new Logger(EmployeeService.name);

    constructor(
        private readonly prisma: PrismaService
    ){}

    public async getEmployeeByGoogleId(googleId: string){
        try {
            const emp = await this.prisma.employee.findFirst({
                where: {googleId: googleId}
            })
            return emp
        } catch (error) {
            this.logger.error(`Failed to fetch employee by googleId ${googleId}`, error.stack);
            throw new InternalServerErrorException('Internal server error, while fetching employee by googleId')
        }
    }

    public async createGoogleAuthenticatedEmployee(googleUser: GoogleUser) {
        try {
            const emp = await this.prisma.$transaction(async (tx) => {
                const tenant = await tx.tenant.create({
                    data: {
                        name: null,
                        branch: null,
                    }
                });

                return tx.employee.create({
                    data: {
                        email: googleUser.email,
                        name: googleUser.name,
                        googleId: googleUser.googleId,
                        tenantId: tenant.id,
                    },
                });
            });

            this.logger.log(`Created new employee: ${emp.email}`);
            return emp;
        } catch (error) {
            this.logger.error(`Failed to create employee for ${googleUser.email}`, error.stack);
            throw new InternalServerErrorException('Internal server error while creating employee account');
        }
    }
}
