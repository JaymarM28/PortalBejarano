import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { HousesService } from './houses.service';
import { CreateHouseDto, UpdateHouseDto } from './dto/house.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';

@Controller('houses')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class HousesController {
  constructor(private readonly housesService: HousesService) {}

  /**
   * Crear una nueva casa
   * POST /houses
   */
  @Post()
  create(@Body() createHouseDto: CreateHouseDto) {
    return this.housesService.create(createHouseDto);
  }

  /**
   * Listar todas las casas con estadísticas
   * GET /houses
   */
  @Get()
  findAll() {
    return this.housesService.findAll();
  }

  /**
   * Obtener detalles de una casa
   * GET /houses/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.housesService.findOne(id);
  }

  /**
   * Obtener estadísticas de una casa
   * GET /houses/:id/stats
   */
  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.housesService.getStats(id);
  }

  /**
   * Actualizar una casa
   * PATCH /houses/:id
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHouseDto: UpdateHouseDto) {
    return this.housesService.update(id, updateHouseDto);
  }

  /**
   * Eliminar una casa (solo si no tiene datos)
   * DELETE /houses/:id
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.housesService.remove(id);
  }
}
