import { Controller, Get, Param, Query, Patch, Body, Post } from '@nestjs/common';
import { ProductsService } from '@/products/product.service';

@Controller('uploads/:uploadId/products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  findByUpload(
    @Param('uploadId') uploadId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query() filters: Record<string, string>
  ) {
    return this.service.findByUpload(uploadId, +page, +limit, filters);
  }

  @Post()
  initializeSelected(
    @Param('uploadId') uploadId: string,
    @Body() body: { attributeIds: string[] },
  ) {
    return this.service.initializeAttributes(uploadId, body.attributeIds);
  }

  @Post('enrich')
  enrichProducts(
    @Param('uploadId') uploadId: string,
    @Body() body: { productIds?: string[] }
  ) {
    return this.service.enrich(uploadId, body.productIds);
  }
}

@Controller('products')
export class ProductController {
  constructor(private readonly service: ProductsService) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }
}