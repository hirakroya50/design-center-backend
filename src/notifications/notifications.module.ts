import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { WHATSAPP_CHANNEL } from './channels/channel.interface';
import { WhatsappMock } from './channels/whatsapp-mock';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    { provide: WHATSAPP_CHANNEL, useClass: WhatsappMock },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
