/**
 * Railway Oriented Programming (ROP).
 *
 * Un `Result<T, E>` representa el resultado de una operación que puede terminar
 * en éxito (`ok`) con un valor `T`, o en un error de negocio esperable (`err`)
 * con un error tipado `E`. Los casos de uso retornan `Result` en lugar de lanzar
 * excepciones para flujos esperables (tarjeta declinada, sin stock, etc.); las
 * excepciones se reservan para fallas realmente inesperadas (infraestructura).
 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T, E = never>(value: T): Result<T, E> => ({
  ok: true,
  value,
});

export const err = <E, T = never>(error: E): Result<T, E> => ({
  ok: false,
  error,
});

export const isOk = <T, E>(
  result: Result<T, E>,
): result is { ok: true; value: T } => result.ok;

export const isErr = <T, E>(
  result: Result<T, E>,
): result is { ok: false; error: E } => !result.ok;

/** Transforma el valor de éxito; deja pasar el error sin tocar. */
export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> => (result.ok ? ok(fn(result.value)) : result);

/** Transforma el error; deja pasar el éxito sin tocar. */
export const mapErr = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> => (result.ok ? result : err(fn(result.error)));

/** Encadena una operación que también puede fallar (bind / flatMap). */
export const chain = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> => (result.ok ? fn(result.value) : result);

/** Versión async de `chain`: el siguiente paso del pipeline devuelve una promesa. */
export const chainAsync = async <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, E>>,
): Promise<Result<U, E>> => (result.ok ? fn(result.value) : result);

/** Colapsa el `Result` en un único valor, manejando ambas ramas. */
export const match = <T, E, R>(
  result: Result<T, E>,
  handlers: { ok: (value: T) => R; err: (error: E) => R },
): R => (result.ok ? handlers.ok(result.value) : handlers.err(result.error));

/** Devuelve el valor de éxito o un valor por defecto si es error. */
export const unwrapOr = <T, E>(result: Result<T, E>, fallback: T): T =>
  result.ok ? result.value : fallback;
