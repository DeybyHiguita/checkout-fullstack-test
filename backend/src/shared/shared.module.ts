import { Global, Module } from '@nestjs/common';
import { CLOCK } from './domain/ports/clock.port';
import { ID_GENERATOR } from './domain/ports/id-generator.port';
import { SystemClockAdapter } from './infrastructure/system-clock.adapter';
import { UuidGeneratorAdapter } from './infrastructure/uuid-generator.adapter';

/**
 * Puertos transversales (Clock, IdGenerator) disponibles para todos los módulos.
 * Global para no re-importarlo en cada módulo que los necesite.
 */
@Global()
@Module({
  providers: [
    { provide: CLOCK, useClass: SystemClockAdapter },
    { provide: ID_GENERATOR, useClass: UuidGeneratorAdapter },
  ],
  exports: [CLOCK, ID_GENERATOR],
})
export class SharedModule {}
