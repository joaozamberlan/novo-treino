import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { redactSensitiveUrlSegments } from '../utils/redact';

/**
 * Log de acesso básico: método, rota (com tokens redigidos), status e duração.
 * Nunca loga headers, body ou query string — evita vazar senha, JWT ou
 * tokenAcesso completos, que podem estar em qualquer um desses lugares.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const start = Date.now();
    const path = redactSensitiveUrlSegments(request.originalUrl || request.url);
    const method = request.method;

    return next.handle().pipe(
      tap({
        next: () => this.log(method, path, response.statusCode, start),
        error: () => this.log(method, path, response.statusCode || 500, start),
      }),
    );
  }

  private log(
    method: string,
    path: string,
    statusCode: number,
    start: number,
  ): void {
    const durationMs = Date.now() - start;
    this.logger.log(`${method} ${path} ${statusCode} ${durationMs}ms`);
  }
}
