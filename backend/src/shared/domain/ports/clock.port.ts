/** Puerto para obtener la hora actual (permite testear sin depender de `Date.now()`). */
export const CLOCK = Symbol('CLOCK');

export interface ClockPort {
  now(): Date;
}
