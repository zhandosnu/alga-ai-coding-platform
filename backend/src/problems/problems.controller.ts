import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProblemsService } from './problems.service';
import { CreateProblemDto, UpdateProblemDto, ProblemQueryDto } from './dto/problem.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Problems')
@UseGuards(JwtAuthGuard)
@Controller('problems')
export class ProblemsController {
  constructor(private problemsService: ProblemsService) {}

  @Public()
  @Get()
  findAll(@Query() query: ProblemQueryDto) {
    return this.problemsService.findAll(query, false);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Get('admin')
  findAllAdmin(@Query() query: ProblemQueryDto) {
    return this.problemsService.findAll(query, true);
  }

  @Public()
  @Get('tags')
  getTags() {
    return this.problemsService.getTags();
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.problemsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.problemsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: CreateProblemDto) {
    return this.problemsService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProblemDto) {
    return this.problemsService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.problemsService.delete(id);
  }
}
