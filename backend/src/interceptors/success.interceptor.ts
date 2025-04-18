import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Observable, map } from 'rxjs';
  
  export interface Response<T> {
    data: T;
  }
  @Injectable()
  export class HttpSuccessInterceptor<T>
    implements NestInterceptor<T, Response<T>>
  {
    intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Observable<Response<T>> {
      return next.handle().pipe(
        map((data) => ({
          statusCode: context.switchToHttp().getResponse().statusCode,
          success: true,
          data,
        })),
      );
    }
  }