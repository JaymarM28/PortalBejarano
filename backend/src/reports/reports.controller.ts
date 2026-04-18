import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummary(
    @Query('year') year: number,
    @Query('month') month: number,
    @Request() req,
  ) {
    return this.reportsService.getSummary(
      req.user.userId,
      req.user.houseId,
      Number(year) || new Date().getFullYear(),
      month ? Number(month) : undefined,
    );
  }

  @Get('annual')
  getAnnualSummary(@Query('year') year: number, @Request() req) {
    return this.reportsService.getAnnualSummary(
      req.user.userId,
      req.user.houseId,
      Number(year) || new Date().getFullYear(),
    );
  }
}
