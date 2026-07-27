import { API_BASE_URL as BASE_URL } from './base-url';

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Error de API con el shape estándar del backend. */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.statusCode = body.statusCode;
    this.code = body.error;
    this.details = body.details;
  }
}

async function parseError(response: Response): Promise<ApiError> {
  const fallback: ApiErrorBody = {
    statusCode: response.status,
    error: 'UNKNOWN_ERROR',
    message: 'Ocurrió un error inesperado',
  };
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    return new ApiError({ ...fallback, ...body });
  } catch {
    return new ApiError(fallback);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as T;
}

function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export const apiClient = { get, post };
