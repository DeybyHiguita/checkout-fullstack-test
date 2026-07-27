import { Inject, Injectable } from '@nestjs/common';
import { err, ok, Result } from '../../../shared/domain/result';
import { Customer } from '../domain/customer.entity';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
} from '../domain/customer.repository';

export type GetCustomerError = {
  type: 'CUSTOMER_NOT_FOUND';
  customerId: string;
};

@Injectable()
export class GetCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customers: CustomerRepository,
  ) {}

  async execute(
    customerId: string,
  ): Promise<Result<Customer, GetCustomerError>> {
    const customer = await this.customers.findById(customerId);
    return customer
      ? ok(customer)
      : err({ type: 'CUSTOMER_NOT_FOUND', customerId });
  }
}
