import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { VisitorsService } from './visitors.service';
import { FollowUpDto } from './dto/follow-up.dto';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { CreateTimelineDto } from './dto/create-timeline.dto';

@Controller('visitors')
@UseGuards(OptionalJwtAuthGuard)
export class VisitorsController {
  constructor(private visitors: VisitorsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req: { user: { id: string } }) {
    return this.visitors.findByHostess(req.user.id);
  }

  @Post()
  create(
    @Request() req: { user?: { id: string } },
    @Body() dto: CreateVisitorDto,
  ) {
    return this.visitors.create(req.user?.id ?? null, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitors.findOne(id);
  }

  @Put(':id')
  update(
    @Request() req: { user?: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateVisitorDto,
  ) {
    return this.visitors.update(id, dto, !!req.user);
  }

  @Post(':id/timeline')
  addTimeline(
    @Param('id') id: string,
    @Body() body: CreateTimelineDto,
  ) {
    return this.visitors.addTimelineEvent(id, body);
  }

  @Post(':id/follow-up')
  @UseGuards(JwtAuthGuard)
  followUp(@Param('id') id: string, @Body() dto: FollowUpDto) {
    return this.visitors.followUp(id, dto);
  }

  @Post(':id/email')
  @UseGuards(JwtAuthGuard)
  sendEmail(@Param('id') id: string) {
    return this.visitors.sendEmail(id);
  }

  @Post(':id/sms')
  @UseGuards(JwtAuthGuard)
  sendSms(@Param('id') id: string) {
    return this.visitors.sendSms(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.visitors.remove(id);
  }
}
