import { HttpStatus } from '@nestjs/common';
import { err, ok } from '../../../../shared/domain/result';
import { DomainException } from '../../../../shared/http/domain.exception';
import { Customer } from '../../domain/customer.entity';
import { GetCustomerUseCase } from '../../application/get-customer.use-case';
import { CustomersController } from './customers.controller';

const customer = Customer.fromPersistence({
  id: 'c1',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  documentType: 'CC',
  documentNumber: '1234567890',
  phoneNumber: '3001234567',
});

describe('CustomersController', () => {
  it('devuelve el cliente si existe', async () => {
    const useCase = {
      execute: jest.fn().mockResolvedValue(ok(customer)),
    } as unknown as GetCustomerUseCase;
    const res = await new CustomersController(useCase).detail('c1');
    expect(res.email).toBe('jane@example.com');
  });

  it('lanza 404 si no existe', async () => {
    const useCase = {
      execute: jest
        .fn()
        .mockResolvedValue(
          err({ type: 'CUSTOMER_NOT_FOUND', customerId: 'x' }),
        ),
    } as unknown as GetCustomerUseCase;
    await new CustomersController(useCase)
      .detail('x')
      .catch((e: DomainException) => {
        expect(e).toBeInstanceOf(DomainException);
        expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
      });
    await expect(
      new CustomersController(useCase).detail('x'),
    ).rejects.toBeDefined();
  });
});
