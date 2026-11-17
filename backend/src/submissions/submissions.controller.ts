import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateSubmissionDto) {
    return this.submissionsService.create(user._id.toString(), dto);
  }

  @Get('my')
  getMySubmissions(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.submissionsService.findByUser(
      user._id.toString(),
      limit ? parseInt(limit) : 20,
      page ? parseInt(page) : 1,
    );
  }

  /** Get current user's submissions for a specific problem — persisted, survives refresh */
  @Get('problem/:problemId')
  getMyProblemSubmissions(
    @CurrentUser() user: any,
    @Param('problemId') problemId: string,
  ) {
    return this.submissionsService.findByUserAndProblem(
      user._id.toString(),
      problemId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.submissionsService.findById(id);
  }
}
