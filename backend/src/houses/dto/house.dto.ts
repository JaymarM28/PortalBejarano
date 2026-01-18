import { IsString, IsNotEmpty, IsOptional, IsBoolean, Matches } from 'class-validator';

export class CreateHouseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug debe contener solo letras minúsculas, números y guiones',
  })
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateHouseDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug debe contener solo letras minúsculas, números y guiones',
  })
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
