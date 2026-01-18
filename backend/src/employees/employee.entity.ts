import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Payment } from '../payments/payment.entity';
import { House } from '../houses/house.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  documentId: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  position: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  baseSalary: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => House, house => house.employees)
  @JoinColumn({ name: 'houseId' })
  house: House;

  @Column({ nullable: true })
  houseId: string;    

  @OneToMany(() => Payment, payment => payment.employee)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
