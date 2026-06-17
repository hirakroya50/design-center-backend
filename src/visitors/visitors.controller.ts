import { Body, Controller, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VisitorsService } from './visitors.service';

@Controller('visitors')
@UseGuards(JwtAuthGuard)
export class VisitorsController {
  constructor(private visitors: VisitorsService) {}

  @Get()
  findMine(@Request() req: { user: { id: string } }) {
    return this.visitors.findByHostess(req.user.id);
  }

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() body: any) {
    return this.visitors.create(req.user.id, body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitors.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.visitors.update(id, body);
  }

  @Post(':id/timeline')
  addTimeline(@Param('id') id: string, @Body() body: { label: string; detail?: string }) {
    return this.visitors.addTimelineEvent(id, body);
  }
}
