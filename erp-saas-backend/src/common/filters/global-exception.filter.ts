import {
  ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Sentry } from '../observability/sentry.config';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!(exception instanceof HttpException) || status >= 500) {
      Sentry.captureException(exception);
      // Sin esto un 500 llega al cliente sin dejar rastro del error original
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const rawResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const extra =
      typeof rawResponse === 'object' && rawResponse !== null && !Array.isArray(rawResponse)
        ? (rawResponse as Record<string, unknown>)
        : {};

    const message =
      exception instanceof HttpException
        ? (extra.message as string | string[] | undefined) ?? exception.message
        : 'Internal server error';

    response.status(status).json({
      success: false,
      message: Array.isArray(message) ? message.join(', ') : message,
      ...(extra.code ? { code: extra.code } : {}),
      ...(extra.limit !== undefined ? { limit: extra.limit } : {}),
      ...(extra.current !== undefined ? { current: extra.current } : {}),
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
      statusCode: status,
    });
  }
}
