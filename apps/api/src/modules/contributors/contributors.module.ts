import { Module } from '@nestjs/common';
import { ContributorsController } from './contributors.controller';
import { ContributorsService } from './contributors.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContributorsController],
  providers: [ContributorsService],
  exports: [ContributorsService],
})
export class ContributorsModule {}
