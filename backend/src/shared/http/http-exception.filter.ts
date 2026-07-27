import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppErrorBody, DomainException } from './domain.exception';

/**
 * Filtro global que normaliza TODAS las respuestas de error al shape:
 *   { statusCode, error, message, details? }
 *
 * - DomainException ya trae ese shape.
 * - Errores del ValidationPipe (BadRequest con message[]) se mapean a VALIDATION_ERROR.
 * - Cualquier excepción no controlada => 500 INTERNAL_ERROR (sin filtrar detalles).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body = this.toBody(exception);

    if (body.statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${body.error}`,
        exception as Error,
      );
    }

    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): AppErrorBody {
    // DomainException ya trae el shape armado en su response body.
    if (exception instanceof DomainException) {
      return exception.getResponse() as AppErrorBody;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      // Errores estándar de Nest (ValidationPipe, NotFound, etc.).
      const message = this.extractMessage(res);
      const validationStatuses: number[] = [
        HttpStatus.BAD_REQUEST,
        HttpStatus.UNPROCESSABLE_ENTITY,
      ];
      const error = validationStatuses.includes(status)
        ? 'VALIDATION_ERROR'
        : this.statusToCode(status);
      return { statusCode: status, error, message };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado',
    };
  }

  private extractMessage(res: unknown): string {
    if (typeof res === 'string') return res;
    if (typeof res === 'object' && res !== null && 'message' in res) {
      const message = res.message;
      if (Array.isArray(message)) return message.join('; ');
      if (typeof message === 'string') return message;
    }
    return 'Error';
  }

  private statusToCode(status: number): string {
    const codeByStatus: Record<number, string> = {
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.BAD_GATEWAY]: 'GATEWAY_UNAVAILABLE',
    };
    return codeByStatus[status] ?? 'ERROR';
  }
}
