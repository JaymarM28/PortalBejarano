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
import { HousesModule } from './houses/houses.module';
import { IncomesModule } from './incomes/incomes.module';
import { ReportsModule } from './reports/reports.module';
import { Income } from './incomes/income.entity';

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
      // SSL activo por defecto (Neon lo exige). DB_SSL=false lo desactiva (BD local);
      // DB_SSL_REJECT_UNAUTHORIZED=true activa la verificación del certificado.
      ssl:
        process.env.DB_SSL === 'false'
          ? false
          : { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' },
      entities: [User, Employee, Payment, Category, MarketExpense, Income],
      // Antes era `true` fijo: TypeORM alteraba el esquema de producción en cada arranque.
      // Ahora solo se sincroniza si se pide explícitamente con DB_SYNCHRONIZE=true.
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: false,
      autoLoadEntities: true,
    }),
    AuthModule,
    UsersModule,
    EmployeesModule,
    PaymentsModule,
    CategoriesModule,
    MarketExpensesModule,
    EmailModule,
    HousesModule,
    IncomesModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
