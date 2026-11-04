import { resolveHouseScope } from '../common/house-scope';
import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Delete,
  Body, 
  Param, 
  UseGuards,
  Request,
  Query
} from '@nestjs/common';
import { MarketExpensesService } from './market-expenses.service';
import { CreateMarketExpenseDto, UpdateMarketExpenseDto } from './dto/market-expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('market-expenses')
@UseGuards(JwtAuthGuard)
export class MarketExpensesController {
  constructor(private readonly marketExpensesService: MarketExpensesService) {}

  @Post()
  create(@Body() createDto: CreateMarketExpenseDto, @Request() req) {
    return this.marketExpensesService.create(createDto, req.user.userId, resolveHouseScope(req.user));
  }

  @Get()
  findAll(@Request() req) {
    return this.marketExpensesService.findAll(resolveHouseScope(req.user));
  }

  @Get('stats/month')
  getStatsByMonth(@Query('year') year: number, @Query('month') month: number, @Request() req) {
    return this.marketExpensesService.getStatsByMonth(Number(year), Number(month), resolveHouseScope(req.user));
  }

  @Get('stats/general')
  getGeneralStats(@Request() req) {
    return this.marketExpensesService.getGeneralStats(resolveHouseScope(req.user));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.marketExpensesService.findOne(id, resolveHouseScope(req.user));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateMarketExpenseDto, @Request() req) {
    return this.marketExpensesService.update(id, updateDto, resolveHouseScope(req.user));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.marketExpensesService.remove(id, resolveHouseScope(req.user));
  }
}
