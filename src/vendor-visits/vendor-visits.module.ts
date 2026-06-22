import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VendorVisitsController } from './vendor-visits.controller';
import { VendorVisitsService } from './vendor-visits.service';

@Module({
  imports: [PrismaModule],
  controllers: [VendorVisitsController],
  providers: [VendorVisitsService],
  exports: [VendorVisitsService],
})
export class VendorVisitsModule {}
