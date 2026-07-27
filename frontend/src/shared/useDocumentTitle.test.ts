import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from './useDocumentTitle';

describe('useDocumentTitle', () => {
  it('actualiza document.title con el sufijo de la app', () => {
    renderHook(() => useDocumentTitle('Resumen'));
    expect(document.title).toBe('Resumen · Checkout');
  });
});
