import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { VendorVisitsService } from './vendor-visits.service';

@Controller()
export class VendorVisitsController {
  constructor(private vendorVisits: VendorVisitsService) {}

  @Post('visitors/:visitorId/vendor-visits/:vendorId')
  recordVisit(
    @Param('visitorId') visitorId: string,
    @Param('vendorId') vendorId: string,
  ) {
    return this.vendorVisits.recordVisit(visitorId, vendorId);
  }

  @Get('visitors/:visitorId/vendor-visits')
  @UseGuards(OptionalJwtAuthGuard)
  findByVisitor(@Param('visitorId') visitorId: string) {
    return this.vendorVisits.findByVisitor(visitorId);
  }

  @Get('visitors/:visitorId/vendor-activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getLeadVendorActivity(@Param('visitorId') visitorId: string) {
    return this.vendorVisits.getLeadVendorActivity(visitorId);
  }

  @Get('admin/vendor-visits/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getStats() {
    return this.vendorVisits.getAggregatedStats();
  }
}
