import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { House } from '../houses/house.entity';

export enum IncomeType {
  SALARY = 'salary',
  FREELANCE = 'freelance',
  RENTAL = 'rental',
  INVESTMENT = 'investment',
  OTHER = 'other',
}

@Entity('incomes')
export class Income {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 200 })
  description: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: IncomeType,
    default: IncomeType.SALARY,
  })
  type: IncomeType;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => House, { eager: false })
  @JoinColumn({ name: 'houseId' })
  house: House;

  @Column()
  houseId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
