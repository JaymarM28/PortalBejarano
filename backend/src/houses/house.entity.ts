import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Employee } from '../employees/employee.entity';
import { Payment } from '../payments/payment.entity';
import { Category } from '../categories/category.entity';
import { MarketExpense } from '../market-expenses/market-expense.entity';

@Entity('houses')
export class House {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string; // "Casa de JaymarM", "Casa de Pedro"

  @Column({ unique: true, length: 100 })
  slug: string; // "casa-jaymar", "casa-pedro" (para URLs amigables)

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  // Relaciones
  @OneToMany(() => User, user => user.house)
  users: User[];

  @OneToMany(() => Employee, employee => employee.house)
  employees: Employee[];

  @OneToMany(() => Payment, payment => payment.house)
  payments: Payment[];

  @OneToMany(() => Category, category => category.house)
  categories: Category[];

  @OneToMany(() => MarketExpense, expense => expense.house)
  marketExpenses: MarketExpense[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
