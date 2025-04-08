import { Patch } from '@nestjs/common';
import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { AttributesService } from '@/attributes/attribute.service';
import { AttributeDefinition } from '@/attributes/entities/attribute.entities';

@Controller('attributes')
export class AttributesController {
  constructor(private readonly service: AttributesService) {}

  @Get()
  findAll(): Promise<AttributeDefinition[]> {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: Partial<AttributeDefinition>) {
    return this.service.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<AttributeDefinition>) {
    return this.service.update(id, body);
  }
}