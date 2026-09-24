import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';

import { UsersModule } from './modules/users/users.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { ContributorsModule } from './modules/contributors/contributors.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { CustomersModule } from './modules/customers/customers.module';
import { InvoicesModule } from './modules/invoices/invoices.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PermissionsModule,
    CategoriesModule,
    EntitiesModule,
    ContributorsModule,
    ArticlesModule,
    CustomersModule,
    InvoicesModule,
    HealthModule,
    PatientsModule,
    AppointmentsModule,
  ],
})
export class AppModule {}
