import { Module } from '@nestjs/common';
import { OauthService } from './oauth.service';
import { OauthController } from './oauth.controller';
import { EmployeeModule } from '../employee/employee.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [EmployeeModule,AuthModule],
  providers: [OauthService],
  controllers: [OauthController]
})
export class OauthModule {}
