import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@ApiTags('Feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedback.create(userId, companyId, dto);
  }
}
