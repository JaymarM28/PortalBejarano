import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { IncomeType } from '../income.entity';

export class CreateIncomeDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  date: string;

  @IsEnum(IncomeType)
  @IsOptional()
  type?: IncomeType;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateIncomeDto extends PartialType(CreateIncomeDto) {}
