import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Payment } from '../payments/payment.entity';
import { House } from '../houses/house.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  ADMINHOUSE = 'admin_house'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  fullName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ADMIN
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => House, house => house.employees)
  @JoinColumn({ name: 'houseId' })
  house: House;

  @Column({ nullable: true })
  houseId: string;  

  @OneToMany(() => Payment, payment => payment.employer)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
