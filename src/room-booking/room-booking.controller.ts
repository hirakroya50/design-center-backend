import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoomBookingService } from './room-booking.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class RoomBookingController {
  constructor(private service: RoomBookingService) {}

  @Get('rooms')
  listRooms() {
    return this.service.listRooms();
  }

  @Get('rooms/:id/slots')
  getSlots(@Param('id') id: string, @Query('date') date: string) {
    return this.service.getSlots(id, date);
  }

  @Post('rooms/:id/book')
  bookRoom(
    @Param('id') id: string,
    @Body() body: { date: string; startAt: string; endAt: string; purpose: string; contactInfo?: string; visitorId?: string },
    @Request() req: { user: { id: string } },
  ) {
    return this.service.bookRoom(id, { ...body, userId: req.user.id });
  }

  @Get('room-bookings')
  listBookings(@Request() req: { user: { id: string; role: string } }) {
    if (req.user.role === 'admin') return this.service.listBookings();
    return this.service.listBookings(req.user.id);
  }
}
