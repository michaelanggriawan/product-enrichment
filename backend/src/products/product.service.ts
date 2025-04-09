import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@/uploads/entities/product.entity';
import { OpenAI } from 'openai';
import { AttributeDefinition } from '@/attributes/entities/attribute.entities';
import { In } from 'typeorm';

@Injectable()
export class ProductsService {
  private openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY });

  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
    @InjectRepository(AttributeDefinition)
    private readonly attrRepo: Repository<AttributeDefinition>
  ) {}

  async findByUpload(
    uploadId: string,
    page = 1,
    limit = 10,
    filters: Record<string, string> & { sortBy?: string; sortOrder?: 'ASC' | 'DESC'; search?: string }
  ) {
    try {
      const sortBy = filters.sortBy || 'name';
      const sortOrder = filters.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      const query = this.repo
        .createQueryBuilder('product')
        .where('product.uploadId = :uploadId', { uploadId })
        .orderBy(`product.${sortBy}`, sortOrder)
        .take(limit)
        .skip((page - 1) * limit);

         // Unified search filter
      if (filters.search) {
        const term = `%${filters.search.toLowerCase()}%`;
        query.andWhere(
          `(LOWER(product.name) LIKE :term OR LOWER(product.brand) LIKE :term OR LOWER(product.barcode) LIKE :term OR EXISTS (
            SELECT 1 FROM jsonb_each_text(product.attributes) 
            WHERE LOWER(value) LIKE :term
          ))`,
          { term }
        );
      }

      for (const [key, value] of Object.entries(filters)) {
        if (['page', 'limit', 'sortBy', 'sortOrder', 'search'].includes(key)) continue;

        if (['brand', 'name', 'barcode'].includes(key)) {
          query.andWhere(`LOWER(product.${key}) LIKE LOWER(:${key})`, {
            [key]: `%${value}%`,
          });
        } else {
          query.andWhere(`LOWER(product.attributes ->> :attrKey) LIKE LOWER(:attrVal)`, {
            attrKey: key,
            attrVal: `%${value}%`,
          });
        }
      }

      const [items, total] = await query.getManyAndCount();

      return { total, items, page, limit };
    } catch (error) {
      console.error('Error in findByUpload:', error);
      throw new InternalServerErrorException('Failed to retrieve products');
    }
  }

  async update(id: string, data: Partial<Product>) {
    try {
      const result = await this.repo.update(id, data);
      if (result.affected === 0) {
        throw new NotFoundException(`Product with id ${id} not found`);
      }
      return result;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  async enrich(uploadId: string, productIds?: string[]) {
    try {
      const productQuery = this.repo
        .createQueryBuilder('product')
        .where('product.uploadId = :uploadId', { uploadId });
  
      if (productIds && productIds.length > 0) {
        productQuery.andWhere('product.id IN (:...productIds)', { productIds });
      }
  
      const products = await productQuery.getMany();
  
      if (!products.length) {
        throw new NotFoundException(`No products found for enrichment`);
      } 

      const enriched = await Promise.all(
        products.map(async (product) => {
          const initializedKeys = Object.keys(product.attributes || {});
          const missing = initializedKeys.filter(
            key =>
              product.attributes?.[key] == null ||
              product.attributes?.[key] === ''
          );
          if (missing.length === 0) return product;
  
          const firstImage = product.images?.[0] || '';
          const prompt = `Given the product below, fill in only the following missing attributes: ${missing.join(', ')}.
  
  Name: ${product.name}
  Brand: ${product.brand}
  Barcode: ${product.barcode}
  Image: ${firstImage}
  
  Return a valid JSON with only the missing attributes.`;
          try {
            const completion = await this.openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [{ role: 'user', content: prompt }],
            });
  
            const content = completion.choices[0].message.content?.trim() || '{}';
            const cleaned = content.replace(/```json|```/g, '').trim();
            const newAttributes = JSON.parse(cleaned);

  
          // Normalize both keys
          const normalizedNewAttributes = Object.fromEntries(
            Object.entries(newAttributes).map(([key, value]) => [key.trim().toLowerCase(), value])
          );

          const currentAttributes = Object.fromEntries(
            Object.entries(product.attributes || {}).map(([key, value]) => [key.trim().toLowerCase(), value])
          );

          product.attributes = {
            ...currentAttributes,
            ...normalizedNewAttributes,
          };

            return product;
          } catch (err) {
            console.error(`Enrichment failed for product ${product.id}`, err);
            return product;
          }
        })
      );
      
      await this.repo.save(enriched);
      return { enriched: enriched.length };
    } catch (error) {
      console.error('Error during enrichment:', error);
      throw new InternalServerErrorException('Failed to enrich products');
    }
  }
  

  async initializeAttributes(uploadId: string, attributeIds: string[]) {
    try {
      const selectedAttributes = await this.attrRepo.findBy({
        id: In(attributeIds),
      });
  
      const expected = selectedAttributes.map(attr => attr.name);
  
      const products = await this.repo.find({ where: { upload: { id: uploadId } } });
      if (!products.length) {
        throw new NotFoundException(`No products found for upload ID: ${uploadId}`);
      }
  
      const updated = products.map(product => {
        const existing = product.attributes || {};
        expected.forEach(key => {
          if (!(key in existing)) {
            existing[key] = null;
          }
        });
        product.attributes = existing;
        return product;
      });
  
      await this.repo.save(updated);
  
      return { initialized: updated.length };
    } catch (error) {
      console.error('Error in initializeAttributes:', error);
      throw new InternalServerErrorException('Failed to initialize product attributes');
    }
  }
}
