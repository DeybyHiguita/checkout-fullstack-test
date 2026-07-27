import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { IdGeneratorPort } from '../domain/ports/id-generator.port';

@Injectable()
export class UuidGeneratorAdapter implements IdGeneratorPort {
  generate(): string {
    return randomUUID();
  }
}
