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
    return this.marketExpensesService.create(createDto, req.user.userId, req.user.houseId);
  }

  @Get()
  findAll(@Request() req) {
    return this.marketExpensesService.findAll(req.user.houseId);
  }

  @Get('stats/month')
  getStatsByMonth(@Query('year') year: number, @Query('month') month: number, @Request() req) {
    return this.marketExpensesService.getStatsByMonth(Number(year), Number(month), req.user.houseId);
  }

  @Get('stats/general')
  getGeneralStats(@Request() req) {
    return this.marketExpensesService.getGeneralStats(req.user.houseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.marketExpensesService.findOne(id, req.user.houseId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateMarketExpenseDto, @Request() req) {
    return this.marketExpensesService.update(id, updateDto, req.user.houseId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.marketExpensesService.remove(id, req.user.houseId);
  }
}