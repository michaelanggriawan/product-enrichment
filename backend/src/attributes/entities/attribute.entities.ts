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
  unit: string;

  @Column('simple-json', { nullable: true })
  options: string[];
}
