import { Module } from '@nestjs/common';
import { RoomBookingController } from './room-booking.controller';
import { RoomBookingService } from './room-booking.service';

@Module({
  controllers: [RoomBookingController],
  providers: [RoomBookingService],
})
export class RoomBookingModule {}
