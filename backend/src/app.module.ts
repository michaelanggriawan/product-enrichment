import { Module, Logger } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsModule } from '@/uploads/upload.module';
import { transports, format } from 'winston';
import { AttributesModule } from '@/attributes/attribute.module';
import { ProductsModule } from '@/products/product.module';
import { WinstonModule, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new transports.Console({
          format: format.combine(
            format.cli(),
            format.splat(),
            format.timestamp(),
            format.printf((info) => {
              return `${info.timestamp} ${info.level}: ${info.message}`;
            }),
          ),
        }),
      ],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
    }),
    UploadsModule,
    AttributesModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: Logger,
      useExisting: WINSTON_MODULE_NEST_PROVIDER, // 🔥 bind Winston logger to Logger token
    },
  ],
})
export class AppModule {}
