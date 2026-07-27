// Aislado en su propio módulo: usa import.meta.env (solo Vite). En Jest se
// reemplaza por test/baseUrlMock.ts vía moduleNameMapper, evitando import.meta.
export const API_BASE_URL =
  (import.meta.env?.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api/v1';
