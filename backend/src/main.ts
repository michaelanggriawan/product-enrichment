import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { HttpSuccessInterceptor } from '@/interceptors/success.interceptor';
import { AllExceptionFilter } from './interceptors/error.interceptor';
import { VersioningType, Logger, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionFilter(app.get(Logger)));
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalInterceptors(new HttpSuccessInterceptor());
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  await app.listen(process.env.PORT);
}
bootstrap();
