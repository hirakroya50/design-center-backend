import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chat: ChatService) {}

  @Get('conversations')
  listConversations(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.chat.listConversations(userId);
  }

  @Post('conversations')
  createConversation(
    @Req() req: Request,
    @Body() body: { visitorId?: string; participantIds: string[] },
  ) {
    const userId = (req.user as any).id;
    const participantIds = body.participantIds.includes(userId)
      ? body.participantIds
      : [...body.participantIds, userId];
    return this.chat.createConversation(body.visitorId ?? null, participantIds);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.chat.getMessages(id, limit ? parseInt(limit, 10) : 50, before);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { text: string },
  ) {
    const userId = (req.user as any).id;
    return this.chat.sendMessage(id, userId, body.text);
  }

  @Get('conversations/:id/poll')
  pollMessages(
    @Param('id') id: string,
    @Query('since') since: string,
  ) {
    return this.chat.pollMessages(id, new Date(since));
  }
}
