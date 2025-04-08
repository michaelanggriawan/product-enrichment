import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as xlsx from 'xlsx';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Upload } from '@/uploads/entities/upload.entity';
import { Product } from '@/uploads/entities/product.entity';
import { ColumnMapping } from '@/uploads/entities/column-mapping.entity';
import { AiMappingService } from '@/ai/ai-mapping.service';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Upload) private uploadRepo: Repository<Upload>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ColumnMapping) private mappingRepo: Repository<ColumnMapping>,
    private readonly aiMappingService: AiMappingService
  ) {}

  async handleUpload(file: Express.Multer.File) {
    let jsonData: any[];
  
    try {
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      jsonData = xlsx.utils.sheet_to_json(sheet);
    } catch (err) {
      throw new BadRequestException('Failed to parse file. Ensure it is a valid CSV or Excel format.');
    }
  
    if (!jsonData || !jsonData.length) {
      throw new BadRequestException('File is empty or has invalid format.');
    }
  
    const headers = Array.from(
      new Set(jsonData.flatMap(row => Object.keys(row)))
    );
  
    const requiredHeaders = ['product name', 'brand', 'barcode', 'images'];

    const missingHeaders = requiredHeaders.filter(
      required =>
        !headers.some(header => header.toLowerCase() === required.toLowerCase())
    );
    
    if (missingHeaders.length > 0) {
      throw new BadRequestException(
        `Missing required header(s): ${missingHeaders.join(', ')}`
      );
    }
    const inferredMapping = await this.aiMappingService.generateColumnMapping(headers);
  
    const upload = this.uploadRepo.create({ fileName: file.originalname });
    await this.uploadRepo.save(upload);
  
    const allowedFields = ['product name', 'brand', 'barcode', 'images'];
    const mappingEntities = Object.entries(inferredMapping)
      .filter(([_, mappedField]) => allowedFields.includes(mappedField?.toLowerCase()))
      .map(([mappedField, originalColumn]) =>
        this.mappingRepo.create({
          mappedField: mappedField as 'name' | 'brand' | 'barcode' | 'images',
          originalColumn,
          upload,
        })
      );
  
    await this.mappingRepo.save(mappingEntities);
  
    const products: Product[] = [];
    const errors: { row: number; message: string }[] = [];
    const seenBarcodes = new Set<string>();
  
    jsonData.forEach((row, i) => {
      const rowIndex = i + 2;
  
      const nameKey = resolveKey(row, 'Product Name') || resolveKey(row, 'name');
      const brandKey = resolveKey(row, 'brand');
      const barcodeKey = resolveKey(row, 'barcode');
      const imageKey = resolveKey(row, 'images');
  
      const name = nameKey ? row[nameKey] : null;
      if (!name) {
        errors.push({ row: rowIndex, message: 'Missing product name' });
        return;
      }
  
      const barcode = barcodeKey ? String(row[barcodeKey]).trim() : '';
      if (barcode && seenBarcodes.has(barcode)) {
        errors.push({ row: rowIndex, message: `Duplicate barcode: ${barcode}` });
        return;
      }
      if (barcode) seenBarcodes.add(barcode);
  
      const imageStr = imageKey ? row[imageKey] : '';
      let imageList: string[] = [];
  
      if (typeof imageStr === 'string') {
        imageList = imageStr.split(';').map((img: string) => img.trim()).filter(Boolean);
      } else if (imageStr && typeof imageStr !== 'string') {
        errors.push({ row: rowIndex, message: 'Invalid format for images (should be string)' });
        return;
      }
  
      const product = this.productRepo.create({
        name,
        brand: brandKey ? row[brandKey] : '',
        barcode,
        images: imageList,
        attributes: {},
        upload,
      });
  
      products.push(product);
    });
  
    await this.productRepo.save(products);
  
    return {
      uploadId: upload.id,
      count: products.length,
      totalRows: jsonData.length,
      errors,
    };
  }
  

  async findAll(page = 1, limit = 10, fileName?: string) {
    const where = fileName ? { fileName: ILike(`%${fileName}%`) } : {};
  
    const [data, total] = await this.uploadRepo.findAndCount({
      where,
      order: { uploadedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteUpload(id: string) {
    const upload = await this.uploadRepo.findOne({ where: { id } });
    if (!upload) throw new NotFoundException('Upload not found');
  
    // Optional: remove related mappings & products
    await this.mappingRepo.delete({ upload: { id } });
    await this.productRepo.delete({ upload: { id } });
  
    await this.uploadRepo.delete(id);
  }
}

function resolveKey(row: Record<string, any>, target: string): string | null {
    return Object.keys(row).find(key => key.toLowerCase() === target.toLowerCase()) || null;
  }