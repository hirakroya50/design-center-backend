import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConsultationsService } from './consultations.service';

@Controller('consultations')
@UseGuards(JwtAuthGuard)
export class ConsultationsController {
  constructor(private consultations: ConsultationsService) {}

  @Get()
  findMine(
    @Request() req: { user: { id: string; role: string } },
    @Query('vendorId') vendorId?: string,
  ) {
    if (vendorId) return this.consultations.findByVendor(vendorId);
    if (req.user.role === 'admin') return this.consultations.findAll();
    return this.consultations.findByUser(req.user.id);
  }

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() body: any) {
    return this.consultations.create(req.user.id, body);
  }
}
