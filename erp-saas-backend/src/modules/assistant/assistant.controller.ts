import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AssistantService } from './assistant.service';
import { AssistantChatDto } from './dto/assistant-chat.dto';

@ApiTags('Assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Get('status')
  status() {
    return this.assistant.getStatus();
  }

  @Post('chat')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  chat(@Body() dto: AssistantChatDto) {
    return this.assistant.chat(dto);
  }
}
