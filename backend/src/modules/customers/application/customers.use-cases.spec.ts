import {
  FakeCustomerRepository,
  FakeIdGenerator,
} from '../../../shared/testing/fakes';
import { Customer } from '../domain/customer.entity';
import { CreateOrGetCustomerUseCase } from './create-or-get-customer.use-case';
import { GetCustomerUseCase } from './get-customer.use-case';

const validInput = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  documentType: 'CC',
  documentNumber: '1234567890',
  phoneNumber: '3001234567',
};

describe('CreateOrGetCustomerUseCase', () => {
  it('crea un cliente nuevo', async () => {
    const repo = new FakeCustomerRepository();
    const result = await new CreateOrGetCustomerUseCase(
      repo,
      new FakeIdGenerator(),
    ).execute(validInput);
    expect(result.ok).toBe(true);
    expect(repo.saved).toHaveLength(1);
  });

  it('reutiliza un cliente existente por email+documento (no duplica)', async () => {
    const existing = Customer.create({ id: 'c-existing', ...validInput });
    if (!existing.ok) throw new Error('setup');
    const repo = new FakeCustomerRepository([existing.value]);
    const result = await new CreateOrGetCustomerUseCase(
      repo,
      new FakeIdGenerator(),
    ).execute(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.id).toBe('c-existing');
    expect(repo.saved).toHaveLength(0);
  });

  it('falla la validación si el documento es inválido', async () => {
    const repo = new FakeCustomerRepository();
    const result = await new CreateOrGetCustomerUseCase(
      repo,
      new FakeIdGenerator(),
    ).execute({
      ...validInput,
      documentNumber: 'abc',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe('INVALID_DOCUMENT');
  });
});

describe('GetCustomerUseCase', () => {
  it('devuelve el cliente si existe', async () => {
    const existing = Customer.create({ id: 'c1', ...validInput });
    if (!existing.ok) throw new Error('setup');
    const repo = new FakeCustomerRepository([existing.value]);
    const result = await new GetCustomerUseCase(repo).execute('c1');
    expect(result.ok).toBe(true);
  });

  it('falla con CUSTOMER_NOT_FOUND si no existe', async () => {
    const result = await new GetCustomerUseCase(
      new FakeCustomerRepository(),
    ).execute('nope');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe('CUSTOMER_NOT_FOUND');
  });
});
