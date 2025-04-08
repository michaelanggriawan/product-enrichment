import { UpdateResult } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeDefinition } from '@/attributes/entities/attribute.entities';

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(AttributeDefinition)
    private attrRepo: Repository<AttributeDefinition>,
  ) {}

  findAll() {
    return this.attrRepo.find();
  }

  create(data: Partial<AttributeDefinition>) {
    const attr = this.attrRepo.create(data);
    return this.attrRepo.save(attr);
  }

  remove(id: string) {
    return this.attrRepo.delete(id);
  }

  update(id: string, data: Partial<AttributeDefinition>): Promise<UpdateResult> {
    return this.attrRepo.update(id, data);
  }
}
