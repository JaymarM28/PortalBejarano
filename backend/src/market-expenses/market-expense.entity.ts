import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { House } from '../houses/house.entity';

@Entity('market_expenses')
export class MarketExpense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ length: 200 })
  place: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'responsibleId' })
  responsible: User;

  @Column()
  responsibleId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => House, house => house.employees)
  @JoinColumn({ name: 'houseId' })
  house: House;

  @Column({ nullable: true })
  houseId: string;    
}
