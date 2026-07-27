import { HttpException } from '@nestjs/common';

export interface AppErrorBody {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Excepción que traduce un error de dominio/aplicación al borde HTTP.
 * Solo se lanza en la capa de infraestructura (controllers), nunca dentro
 * del dominio o los casos de uso (que usan Result).
 */
export class DomainException extends HttpException {
  constructor(body: AppErrorBody) {
    super(body, body.statusCode);
  }
}
