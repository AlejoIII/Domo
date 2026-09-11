import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: 'OK',
        data,
        timestamp: new Date().toISOString(),
        path: request.url,
        statusCode: context.switchToHttp().getResponse().statusCode,
      })),
    );
  }
}
