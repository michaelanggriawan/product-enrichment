import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Upload } from './entities/upload.entity';
import { ColumnMapping } from './entities/column-mapping.entity';
import { Product } from '@/uploads/entities/product.entity';
import { UploadsService } from '@/uploads/upload.service';
import { UploadsController } from '@/uploads/upload.controller';
import { AiModule } from '@/ai/ai-module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Upload, ColumnMapping, Product]),
    AiModule
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
