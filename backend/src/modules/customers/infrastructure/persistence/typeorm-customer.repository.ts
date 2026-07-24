import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../domain/customer.entity';
import { CustomerRepository } from '../../domain/customer.repository';
import { CustomerOrmEntity } from './customer.orm-entity';

@Injectable()
export class TypeOrmCustomerRepository implements CustomerRepository {
  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly repo: Repository<CustomerOrmEntity>,
  ) {}

  async findById(id: string): Promise<Customer | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? TypeOrmCustomerRepository.toDomain(row) : null;
  }

  async findByEmailAndDocument(
    email: string,
    documentNumber: string,
  ): Promise<Customer | null> {
    const row = await this.repo.findOne({ where: { email, documentNumber } });
    return row ? TypeOrmCustomerRepository.toDomain(row) : null;
  }

  async save(customer: Customer): Promise<Customer> {
    await this.repo.save({
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
      phoneNumber: customer.phoneNumber,
    });
    return customer;
  }

  private static toDomain(row: CustomerOrmEntity): Customer {
    return Customer.fromPersistence({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      documentType: row.documentType,
      documentNumber: row.documentNumber,
      phoneNumber: row.phoneNumber,
    });
  }
}
