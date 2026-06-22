import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('visitors')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="visitors.csv"')
  async visitorsCsv() {
    return this.reports.visitorsCsv();
  }

  @Get('consultations')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="consultations.csv"')
  async consultationsCsv() {
    return this.reports.consultationsCsv();
  }

  @Get('analytics')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="analytics.csv"')
  async analyticsCsv() {
    return this.reports.analyticsCsv();
  }
}
