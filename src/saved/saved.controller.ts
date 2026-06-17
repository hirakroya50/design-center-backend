import { Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SavedService } from './saved.service';

@Controller('saved')
@UseGuards(JwtAuthGuard)
export class SavedController {
  constructor(private saved: SavedService) {}

  @Get('vendors')
  getSavedVendors(@Request() req: { user: { id: string } }) {
    return this.saved.getSavedVendorIds(req.user.id);
  }

  @Post('vendors/:id')
  saveVendor(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.saved.saveVendor(req.user.id, id);
  }

  @Delete('vendors/:id')
  unsaveVendor(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.saved.unsaveVendor(req.user.id, id);
  }

  @Get('services')
  getSavedServices(@Request() req: { user: { id: string } }) {
    return this.saved.getSavedServiceIds(req.user.id);
  }

  @Post('services/:id')
  saveService(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.saved.saveService(req.user.id, id);
  }

  @Delete('services/:id')
  unsaveService(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.saved.unsaveService(req.user.id, id);
  }
}
