import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class AttributeDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: 'short_text' | 'long_text' | 'rich_text' | 'number' | 'single_select' | 'multi_select' | 'measure';

  @Column({ nullable: true })
  unit?: string;

  @Column('text', { array: true, nullable: true })
  options?: string[];
}