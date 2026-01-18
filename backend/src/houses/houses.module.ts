import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HousesService } from './houses.service';
import { HousesController } from './houses.controller';
import { House } from './house.entity';

@Module({
  imports: [TypeOrmModule.forFeature([House])],
  controllers: [HousesController],
  providers: [HousesService],
  exports: [HousesService],
})
export class HousesModule {}
