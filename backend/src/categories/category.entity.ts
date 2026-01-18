import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { House } from '../houses/house.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50, nullable: true })
  color: string; // Color hex para UI (ej: #667eea)

  @Column({ length: 50, nullable: true })
  icon: string; // Emoji o icono (ej: 🛒, 💡, 🏠)

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

   @ManyToOne(() => House, house => house.employees)
   @JoinColumn({ name: 'houseId' })
   house: House;
 
   @Column({ nullable: true })
   houseId: string; 

}
