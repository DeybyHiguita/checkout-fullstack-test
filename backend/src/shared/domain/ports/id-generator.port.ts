/** Puerto para generar identificadores (permite testear sin `uuid` real). */
export const ID_GENERATOR = Symbol('ID_GENERATOR');

export interface IdGeneratorPort {
  generate(): string;
}
