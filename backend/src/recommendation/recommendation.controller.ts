import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationController {
  constructor(private recommendationService: RecommendationService) {}

  @Get('next')
  getNext(@CurrentUser() user: any) {
    return this.recommendationService.getNextProblem(user._id.toString());
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.recommendationService.getUserStats(user._id.toString());
  }
}
