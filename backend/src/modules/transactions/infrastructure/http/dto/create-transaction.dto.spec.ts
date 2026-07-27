import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTransactionDto } from './create-transaction.dto';

const validPayload = {
  productId: '11111111-1111-4111-8111-111111111111',
  customer: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    documentType: 'CC',
    documentNumber: '1234567890',
    phoneNumber: '3001234567',
  },
  delivery: {
    addressLine: 'Cra 1 # 2-3',
    city: 'Bogotá',
    region: 'Cundinamarca',
    country: 'CO',
  },
};

const validateDto = (payload: unknown) =>
  validate(plainToInstance(CreateTransactionDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('CreateTransactionDto', () => {
  it('acepta un payload válido', async () => {
    const errors = await validateDto(validPayload);
    expect(errors).toHaveLength(0);
  });

  it('rechaza productId que no es UUID', async () => {
    const errors = await validateDto({ ...validPayload, productId: 'abc' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rechaza email inválido en el objeto anidado', async () => {
    const errors = await validateDto({
      ...validPayload,
      customer: { ...validPayload.customer, email: 'bad' },
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rechaza documentNumber no numérico', async () => {
    const errors = await validateDto({
      ...validPayload,
      customer: { ...validPayload.customer, documentNumber: 'abc123' },
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rechaza addressLine vacío', async () => {
    const errors = await validateDto({
      ...validPayload,
      delivery: { ...validPayload.delivery, addressLine: '' },
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
