import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { ProductServicesService } from './product-services.service';

@Controller('services')
export class ProductServicesController {
  constructor(private services: ProductServicesService) {}

  @Get()
  findAll() { return this.services.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.services.findOne(id); }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() body: any) { return this.services.create(body); }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: any) { return this.services.update(id, body); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) { return this.services.remove(id); }
}
