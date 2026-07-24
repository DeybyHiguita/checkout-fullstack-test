import {
  chain,
  chainAsync,
  err,
  isErr,
  isOk,
  map,
  mapErr,
  match,
  ok,
  unwrapOr,
} from './result';

describe('Result (ROP)', () => {
  it('ok crea un resultado exitoso', () => {
    const r = ok<number>(5);
    expect(r.ok).toBe(true);
    expect(isOk(r)).toBe(true);
    expect(isErr(r)).toBe(false);
    if (r.ok) expect(r.value).toBe(5);
  });

  it('err crea un resultado fallido', () => {
    const r = err<string>('boom');
    expect(r.ok).toBe(false);
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error).toBe('boom');
  });

  describe('map', () => {
    it('transforma el valor de éxito', () => {
      expect(map(ok<number>(2), (n) => n * 3)).toEqual(ok(6));
    });
    it('no toca el error', () => {
      const r = err<string, number>('e');
      expect(map(r, (n) => n * 3)).toEqual(r);
    });
  });

  describe('mapErr', () => {
    it('transforma el error', () => {
      expect(mapErr(err<string>('e'), (e) => `${e}!`)).toEqual(err('e!'));
    });
    it('no toca el éxito', () => {
      const r = ok<number, string>(1);
      expect(mapErr(r, (e) => `${e}!`)).toEqual(r);
    });
  });

  describe('chain', () => {
    const half = (n: number) =>
      n % 2 === 0 ? ok<number, string>(n / 2) : err<string, number>('impar');
    it('encadena en éxito', () => {
      expect(chain(ok<number, string>(8), half)).toEqual(ok(4));
    });
    it('corta en el primer error', () => {
      expect(chain(ok<number, string>(7), half)).toEqual(err('impar'));
    });
    it('propaga error previo sin ejecutar fn', () => {
      const spy = jest.fn(half);
      expect(chain(err<string, number>('prev'), spy)).toEqual(err('prev'));
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('chainAsync', () => {
    it('encadena en éxito', async () => {
      const r = await chainAsync(ok<number, string>(2), async (n) =>
        ok<number, string>(n + 1),
      );
      expect(r).toEqual(ok(3));
    });
    it('no ejecuta fn si viene error', async () => {
      const spy = jest.fn(async (n: number) => ok<number, string>(n));
      const r = await chainAsync(err<string, number>('x'), spy);
      expect(r).toEqual(err('x'));
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('match', () => {
    it('ejecuta rama ok', () => {
      expect(
        match(ok<number, string>(3), {
          ok: (v) => `v${v}`,
          err: (e) => `e${e}`,
        }),
      ).toBe('v3');
    });
    it('ejecuta rama err', () => {
      expect(
        match(err<string, number>('z'), {
          ok: (v) => `v${v}`,
          err: (e) => `e${e}`,
        }),
      ).toBe('ez');
    });
  });

  describe('unwrapOr', () => {
    it('devuelve el valor si es ok', () => {
      expect(unwrapOr(ok<number, string>(9), 0)).toBe(9);
    });
    it('devuelve el fallback si es err', () => {
      expect(unwrapOr(err<string, number>('e'), 0)).toBe(0);
    });
  });
});
