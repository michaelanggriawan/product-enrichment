import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeDefinition } from '@/attributes/entities/attribute.entities';
import { AttributesService } from '@/attributes/attribute.service';
import { AttributesController } from '@/attributes/attribrute.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AttributeDefinition])],
  controllers: [AttributesController],
  providers: [AttributesService],
})
export class AttributesModule {}
