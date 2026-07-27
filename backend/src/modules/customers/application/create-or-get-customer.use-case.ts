import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../shared/domain/result';
import {
  ID_GENERATOR,
  type IdGeneratorPort,
} from '../../../shared/domain/ports/id-generator.port';
import { Customer, type CustomerError } from '../domain/customer.entity';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
} from '../domain/customer.repository';

export interface CustomerInput {
  fullName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  phoneNumber: string;
}

@Injectable()
export class CreateOrGetCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customers: CustomerRepository,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(
    input: CustomerInput,
  ): Promise<Result<Customer, CustomerError>> {
    const created = Customer.create({
      id: this.idGenerator.generate(),
      ...input,
    });
    if (!created.ok) {
      return created;
    }

    const existing = await this.customers.findByEmailAndDocument(
      created.value.email,
      created.value.documentNumber,
    );
    if (existing) {
      return { ok: true, value: existing };
    }

    const saved = await this.customers.save(created.value);
    return { ok: true, value: saved };
  }
}
