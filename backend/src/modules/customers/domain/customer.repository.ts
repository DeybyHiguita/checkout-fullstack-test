import { Customer } from './customer.entity';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByEmailAndDocument(
    email: string,
    documentNumber: string,
  ): Promise<Customer | null>;
  save(customer: Customer): Promise<Customer>;
}
