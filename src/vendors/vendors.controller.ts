import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { VendorsService } from './vendors.service';

@Controller('vendors')
export class VendorsController {
  constructor(private vendors: VendorsService) {}

  @Get()
  findAll() { return this.vendors.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.vendors.findOne(id); }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() body: any) { return this.vendors.create(body); }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: any) { return this.vendors.update(id, body); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) { return this.vendors.remove(id); }
}
