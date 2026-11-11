import { Module } from '@nestjs/common';
import { MessagesWsService } from './messages-ws.service.js';
import { MessagesWsGateway } from './messages-ws.gateway.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  providers: [MessagesWsGateway, MessagesWsService],
  imports: [AuthModule],
})
export class MessagesWsModule {}
