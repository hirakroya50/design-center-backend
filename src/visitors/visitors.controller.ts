import { Body, Controller, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VisitorsService } from './visitors.service';
import { FollowUpDto } from './dto/follow-up.dto';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';

@Controller('visitors')
@UseGuards(JwtAuthGuard)
export class VisitorsController {
  constructor(private visitors: VisitorsService) {}

  @Get()
  findMine(@Request() req: { user: { id: string } }) {
    return this.visitors.findByHostess(req.user.id);
  }

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateVisitorDto) {
    return this.visitors.create(req.user.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitors.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVisitorDto) {
    return this.visitors.update(id, dto);
  }

  @Post(':id/timeline')
  addTimeline(@Param('id') id: string, @Body() body: { label: string; detail?: string }) {
    return this.visitors.addTimelineEvent(id, body);
  }

  @Post(':id/follow-up')
  followUp(@Param('id') id: string, @Body() dto: FollowUpDto) {
    return this.visitors.followUp(id, dto);
  }
}
