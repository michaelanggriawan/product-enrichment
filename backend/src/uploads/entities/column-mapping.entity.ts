import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Upload } from './upload.entity';

@Entity()
export class ColumnMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalColumn: string;

  @Column()
  mappedField: 'name' | 'brand' | 'barcode' | 'images';

  @ManyToOne(() => Upload, upload => upload.id, { onDelete: 'CASCADE' })
  upload: Upload;
}
