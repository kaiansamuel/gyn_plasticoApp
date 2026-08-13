import type { ApiErrorCode, ApiErrorDetail, ApiErrorResponse } from '../schemas/error.schema';
import { getApiUrl } from '../config';

type RequestOptions = {
  body?: unknown;
  method?: 'GET' | 'POST';
  signal?: AbortSignal;
  token?: string;
};

export class ApiError extends Error {
  readonly statusCode?: number;
  readonly code?: ApiErrorCode;
  readonly details?: ApiErrorDetail[];

  constructor(message: string, statusCode?: number, code?: ApiErrorCode, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      method: options.method ?? 'GET',
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }

    throw new ApiError('Não foi possível conectar à API. Verifique sua conexão e tente novamente.');
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const apiError = isApiErrorResponse(payload) ? payload : undefined;
    throw new ApiError(
      apiError?.message ?? 'Não foi possível concluir a solicitação.',
      response.status,
      apiError?.code,
      apiError?.details,
    );
  }

  return payload as T;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ApiErrorResponse>;
  return typeof candidate.message === 'string' && typeof candidate.statusCode === 'number';
}
