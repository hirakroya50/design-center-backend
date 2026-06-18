import { Module } from '@nestjs/common';
import { ProductServicesController } from './product-services.controller';
import { ProductServicesService } from './product-services.service';

@Module({
  controllers: [ProductServicesController],
  providers: [ProductServicesService],
})
export class ProductServicesModule {}
