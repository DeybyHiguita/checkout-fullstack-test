import { Customer } from './customer.entity';

const validProps = {
  id: 'c1',
  fullName: 'Jane Doe',
  email: 'Jane@Example.com',
  documentType: 'CC',
  documentNumber: '1234567890',
  phoneNumber: '3001234567',
};

describe('Customer', () => {
  describe('create', () => {
    it('crea un cliente válido y normaliza email/nombre', () => {
      const r = Customer.create(validProps);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.value.email).toBe('jane@example.com');
        expect(r.value.fullName).toBe('Jane Doe');
      }
    });

    it('rechaza nombre demasiado corto', () => {
      const r = Customer.create({ ...validProps, fullName: 'Jo' });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.type).toBe('INVALID_NAME');
    });

    it('rechaza email inválido', () => {
      const r = Customer.create({ ...validProps, email: 'no-arroba' });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.type).toBe('INVALID_EMAIL');
    });

    it('rechaza documento no numérico', () => {
      const r = Customer.create({ ...validProps, documentNumber: 'abc123' });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.type).toBe('INVALID_DOCUMENT');
    });

    it('rechaza documento demasiado corto', () => {
      const r = Customer.create({ ...validProps, documentNumber: '123' });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.type).toBe('INVALID_DOCUMENT');
    });
  });

  describe('fromPersistence', () => {
    it('rehidrata sin re-validar', () => {
      const c = Customer.fromPersistence({
        ...validProps,
        email: 'stored@x.co',
      });
      expect(c.email).toBe('stored@x.co');
    });
  });
});
