import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HintsService } from './hints.service';
import { RequestHintDto } from './dto/hint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AiClientService } from './ai-client.service';

@ApiTags('Hints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hints')
export class HintsController {
  constructor(
    private hintsService: HintsService,
    private aiClient: AiClientService,
  ) {}

  @Post('request')
  requestHint(@CurrentUser() user: any, @Body() dto: RequestHintDto) {
    return this.hintsService.requestHint(user._id.toString(), dto);
  }

  @Get('session/:problemId')
  getSession(@CurrentUser() user: any, @Param('problemId') problemId: string) {
    return this.hintsService.getSession(user._id.toString(), problemId);
  }

  @Delete('session/:problemId')
  clearSession(@CurrentUser() user: any, @Param('problemId') problemId: string) {
    return this.hintsService.clearSession(user._id.toString(), problemId);
  }

  @Get('models')
  getModels() {
    return this.aiClient.getAvailableModels();
  }
}
