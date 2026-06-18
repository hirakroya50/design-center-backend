import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private profile: ProfileService) {}

  @Get()
  get(@Request() req: { user: { id: string } }) {
    return this.profile.get(req.user.id);
  }

  @Put()
  update(
    @Request() req: { user: { id: string } },
    @Body()
    body: {
      name?: string;
      phone?: string;
      avatarUrl?: string;
      heardAboutUs?: string;
    },
  ) {
    return this.profile.update(req.user.id, body);
  }
}
