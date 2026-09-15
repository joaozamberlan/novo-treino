import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { redactSensitiveUrlSegments } from '../utils/redact';

/**
 * Filtro global de exceções.
 *
 * Garante que toda resposta de erro siga um formato consistente e nunca
 * vaze detalhes internos ao cliente: stack trace, mensagens de erro do
 * Postgres/Prisma, caminhos de arquivo do servidor ou secrets. Exceções
 * conhecidas (HttpException — NotFoundException, BadRequestException do
 * ValidationPipe, etc.) mantêm sua mensagem original, pensada para ser
 * lida pelo cliente. Qualquer erro não tratado vira um 500 genérico para
 * o cliente, com o detalhe completo (incluindo stack) apenas no log do
 * servidor.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = isHttpException
      ? this.buildHttpExceptionBody(exception, status)
      : { statusCode: status, message: 'Erro interno do servidor.' };

    this.logException(exception, request, status);

    response.status(status).json({
      ...body,
      timestamp: new Date().toISOString(),
      path: redactSensitiveUrlSegments(request.originalUrl || request.url),
    });
  }

  private buildHttpExceptionBody(
    exception: HttpException,
    status: number,
  ): Record<string, unknown> {
    const payload = exception.getResponse();
    if (typeof payload === 'string') {
      return { statusCode: status, message: payload };
    }
    // Já é o formato padrão do Nest (ex.: erros de validação do ValidationPipe):
    // { statusCode, message, error }
    return payload as Record<string, unknown>;
  }

  private logException(
    exception: unknown,
    request: Request,
    status: number,
  ): void {
    const safePath = redactSensitiveUrlSegments(
      request.originalUrl || request.url,
    );
    const context = `${request.method} ${safePath}`;

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      const message =
        exception instanceof Error ? exception.message : 'Erro desconhecido';
      this.logger.error(`${context} → ${status} — ${message}`, stack);
    } else if (status === 401 || status === 403) {
      // Sinal relevante de segurança: tentativa de acesso não autorizado/negado.
      this.logger.warn(`${context} → ${status}`);
    }
  }
}
