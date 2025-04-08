import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsController, ProductController } from '@/products/product.controller';
import { Product } from '@/uploads/entities/product.entity';
import { ProductsService } from '@/products/product.service';
import { AttributeDefinition } from '@/attributes/entities/attribute.entities';

@Module({
  imports: [TypeOrmModule.forFeature([Product, AttributeDefinition])],
  controllers: [ProductsController, ProductController],
  providers: [ProductsService],
})
export class ProductsModule {}