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
    return this.marketExpensesService.create(createDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.marketExpensesService.findAll();
  }

  @Get('stats/month')
  getStatsByMonth(@Query('year') year: number, @Query('month') month: number) {
    return this.marketExpensesService.getStatsByMonth(Number(year), Number(month));
  }

  @Get('stats/general')
  getGeneralStats() {
    return this.marketExpensesService.getGeneralStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.marketExpensesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateMarketExpenseDto) {
    return this.marketExpensesService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.marketExpensesService.remove(id);
  }
}
