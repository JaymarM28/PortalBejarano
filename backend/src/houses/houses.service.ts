import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { House } from './house.entity';
import { CreateHouseDto, UpdateHouseDto } from './dto/house.dto';

@Injectable()
export class HousesService {
  constructor(
    @InjectRepository(House)
    private houseRepository: Repository<House>,
  ) {}

  /**
   * Crear una nueva casa
   */
  async create(createHouseDto: CreateHouseDto): Promise<House> {
    // Verificar que no exista una casa con el mismo nombre o slug
    const existingHouse = await this.houseRepository.findOne({
      where: [
        { name: createHouseDto.name },
        { slug: createHouseDto.slug },
      ],
    });

    if (existingHouse) {
      if (existingHouse.name === createHouseDto.name) {
        throw new ConflictException('Ya existe una casa con este nombre');
      }
      if (existingHouse.slug === createHouseDto.slug) {
        throw new ConflictException('Ya existe una casa con este slug');
      }
    }

    const house = this.houseRepository.create(createHouseDto);
    return this.houseRepository.save(house);
  }

  /**
   * Listar todas las casas con estadísticas
   */
  async findAll(): Promise<any[]> {
    const houses = await this.houseRepository.find({
      relations: ['users', 'employees', 'payments'],
      order: { createdAt: 'DESC' },
    });

    return houses.map(house => ({
      id: house.id,
      name: house.name,
      slug: house.slug,
      description: house.description,
      isActive: house.isActive,
      createdAt: house.createdAt,
      updatedAt: house.updatedAt,
      stats: {
        usersCount: house.users?.length || 0,
        employeesCount: house.employees?.length || 0,
        paymentsCount: house.payments?.length || 0,
      },
    }));
  }

  /**
   * Obtener una casa por ID
   */
  async findOne(id: string): Promise<House> {
    const house = await this.houseRepository.findOne({
      where: { id },
      relations: ['users', 'employees'],
    });

    if (!house) {
      throw new NotFoundException('Casa no encontrada');
    }

    return house;
  }

  /**
   * Actualizar una casa
   */
  async update(id: string, updateHouseDto: UpdateHouseDto): Promise<House> {
    const house = await this.findOne(id);

    // Si se está cambiando el nombre o slug, verificar que no exista
    if (updateHouseDto.name || updateHouseDto.slug) {
      const existingHouse = await this.houseRepository.findOne({
        where: [
          { name: updateHouseDto.name },
          { slug: updateHouseDto.slug },
        ],
      });

      if (existingHouse && existingHouse.id !== id) {
        if (existingHouse.name === updateHouseDto.name) {
          throw new ConflictException('Ya existe una casa con ese nombre');
        }
        if (existingHouse.slug === updateHouseDto.slug) {
          throw new ConflictException('Ya existe una casa con ese slug');
        }
      }
    }

    Object.assign(house, updateHouseDto);
    return this.houseRepository.save(house);
  }

  /**
   * Eliminar una casa (solo si no tiene usuarios ni datos)
   */
  async remove(id: string): Promise<void> {
    const house = await this.houseRepository.findOne({
      where: { id },
      relations: ['users', 'employees', 'payments', 'marketExpenses', 'categories'],
    });

    if (!house) {
      throw new NotFoundException('Casa no encontrada');
    }

    // Verificar que no tenga datos
    const hasData = 
      (house.users?.length > 0) ||
      (house.employees?.length > 0) ||
      (house.payments?.length > 0) ||
      (house.marketExpenses?.length > 0) ||
      (house.categories?.length > 0);

    if (hasData) {
      throw new ConflictException(
        'No puede eliminar esta casa. Primero elimine los usuaarios, empleados, pagos y gastos relacionados'
      );
    }

    await this.houseRepository.remove(house);
  }

  /**
   * Obtener estadísticas de una casa
   */
  async getStats(id: string): Promise<any> {
    const house = await this.houseRepository.findOne({
      where: { id },
      relations: ['users', 'employees', 'payments', 'marketExpenses'],
    });

    if (!house) {
      throw new NotFoundException('Casa no encontrada');
    }

    const totalPayments = house.payments?.reduce(
      (sum, payment) => sum + Number(payment.totalAmount),
      0
    ) || 0;

    const totalExpenses = house.marketExpenses?.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    ) || 0;

    return {
      houseId: house.id,
      houseName: house.name,
      stats: {
        users: house.users?.length || 0,
        employees: house.employees?.length || 0,
        payments: house.payments?.length || 0,
        expenses: house.marketExpenses?.length || 0,
        totalPayments,
        totalExpenses,
      },
    };
  }
}
