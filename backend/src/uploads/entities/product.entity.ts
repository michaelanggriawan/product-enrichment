import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Upload } from '@/uploads/entities/upload.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  brand: string;

  @Column({ nullable: true })
  barcode: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column('jsonb', { default: {} })
  attributes: Record<string, any>;

  @ManyToOne(() => Upload, upload => upload.products, { onDelete: 'CASCADE' })
  upload: Upload;
}