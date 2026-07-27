import {
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DomainException } from './domain.exception';
import { HttpExceptionFilter } from './http-exception.filter';

function mockHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'POST', url: '/api/v1/x' }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('pasa el shape de una DomainException tal cual', () => {
    const { host, status, json } = mockHost();
    filter.catch(
      new DomainException({
        statusCode: 409,
        error: 'OUT_OF_STOCK',
        message: 'sin stock',
        details: { productId: 'p1' },
      }),
      host,
    );
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      error: 'OUT_OF_STOCK',
      message: 'sin stock',
      details: { productId: 'p1' },
    });
  });

  it('normaliza errores del ValidationPipe a VALIDATION_ERROR', () => {
    const { host, status, json } = mockHost();
    filter.catch(
      new BadRequestException(['email must be an email', 'name too short']),
      host,
    );
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      message: 'email must be an email; name too short',
    });
  });

  it('mapea NotFoundException a NOT_FOUND', () => {
    const { host, json } = mockHost();
    filter.catch(new NotFoundException('no existe'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, error: 'NOT_FOUND' }),
    );
  });

  it('convierte cualquier excepción no controlada en 500 INTERNAL_ERROR', () => {
    const { host, status, json } = mockHost();
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, error: 'INTERNAL_ERROR' }),
    );
  });
});
