import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('incomes')
@UseGuards(JwtAuthGuard)
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Post()
  create(@Body() dto: CreateIncomeDto, @Request() req) {
    return this.incomesService.create(dto, req.user.userId, req.user.houseId);
  }

  @Get()
  findAll(@Request() req) {
    return this.incomesService.findAll(req.user.userId, req.user.houseId);
  }

  @Get('stats/month')
  getStatsByMonth(@Query('year') year: number, @Query('month') month: number, @Request() req) {
    return this.incomesService.getStatsByMonth(Number(year), Number(month), req.user.userId, req.user.houseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.incomesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIncomeDto, @Request() req) {
    return this.incomesService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.incomesService.remove(id, req.user.userId);
  }
}
