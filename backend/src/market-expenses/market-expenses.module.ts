import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketExpense } from './market-expense.entity';
import { MarketExpensesService } from './market-expenses.service';
import { MarketExpensesController } from './market-expenses.controller';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';


@Module({
  imports: [TypeOrmModule.forFeature([MarketExpense]),
  EmailModule,
  UsersModule],
  controllers: [MarketExpensesController],
  providers: [MarketExpensesService],
  exports: [MarketExpensesService],
})
export class MarketExpensesModule {}
