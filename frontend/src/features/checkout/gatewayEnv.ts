// Aislado (usa import.meta.env de Vite). En Jest se reemplaza por
// test/gatewayEnvMock.ts vía moduleNameMapper.
const env = import.meta.env ?? ({} as ImportMetaEnv);

export const GATEWAY_PUBLIC_KEY = (env.VITE_GATEWAY_PUBLIC_KEY as string | undefined) ?? '';
export const GATEWAY_BASE_URL = (env.VITE_GATEWAY_BASE_URL as string | undefined) ?? '';
