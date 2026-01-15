import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketExpense } from './market-expense.entity';
import { MarketExpensesService } from './market-expenses.service';
import { MarketExpensesController } from './market-expenses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MarketExpense])],
  controllers: [MarketExpensesController],
  providers: [MarketExpensesService],
  exports: [MarketExpensesService],
})
export class MarketExpensesModule {}
