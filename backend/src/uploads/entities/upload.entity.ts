import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Product } from '@/uploads/entities/product.entity';

@Entity()
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @CreateDateColumn()
  uploadedAt: Date;

  @OneToMany(() => Product, (product) => product.upload)
  products: Product[];
}
