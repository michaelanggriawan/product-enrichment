import {
    Controller,
    Post,
    Get,
    UploadedFile,
    UseInterceptors,
    Query,
    Param,
    Delete
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { UploadsService } from '@/uploads/upload.service';
  
  @Controller('uploads')
  export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) {}
  
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
      return this.uploadsService.handleUpload(file);
    }

    @Get()
    findAll(
      @Query('page') page = 1,
      @Query('limit') limit = 10,
      @Query('fileName') fileName?: string,
    ) {
      return this.uploadsService.findAll(+page, +limit, fileName);
    }

    @Delete(':id')
    async deleteUpload(@Param('id') id: string) {
      await this.uploadsService.deleteUpload(id);
      return { message: 'Upload deleted successfully' };
    }
  }
  
