import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { PaymentsModule } from './payments/payments.module';
import { CategoriesModule } from './categories/categories.module';
import { MarketExpensesModule } from './market-expenses/market-expenses.module';
import { EmailModule } from './email/email.module';
import { User } from './users/user.entity';
import { Employee } from './employees/employee.entity';
import { Payment } from './payments/payment.entity';
import { Category } from './categories/category.entity';
import { MarketExpense } from './market-expenses/market-expense.entity';
import { LoggingInterceptor } from './common/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'payroll_db',
      ssl: {
        rejectUnauthorized: false,
      },      
      entities: [User, Employee, Payment, Category, MarketExpense],
      synchronize: true,
      logging: false,
      autoLoadEntities: true,
    }),
    AuthModule,
    UsersModule,
    EmployeesModule,
    PaymentsModule,
    CategoriesModule,
    MarketExpensesModule,
    EmailModule
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
