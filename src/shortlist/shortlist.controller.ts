import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShortlistService } from './shortlist.service';

@Controller('shortlist')
@UseGuards(JwtAuthGuard)
export class ShortlistController {
  constructor(private shortlist: ShortlistService) {}

  @Get()
  get(@Request() req: { user: { id: string } }) {
    return this.shortlist.getIds(req.user.id);
  }

  @Post(':id')
  add(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.shortlist.add(req.user.id, id);
  }

  @Delete(':id')
  remove(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.shortlist.remove(req.user.id, id);
  }
}
