import type { ApiErrorCode, ApiErrorDetail, ApiErrorResponse } from '../schemas/error.schema';
import { getApiUrl } from '../config';

type RequestOptions = {
  body?: unknown;
  method?: 'GET' | 'POST';
  params?: Record<string, boolean | number | string | readonly string[] | undefined>;
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
  const url = new URL(`${getApiUrl()}${path}`);

  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, item);
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  try {
    response = await fetch(url, {
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
    if (response.status === 401 && options.token) {
      window.dispatchEvent(new Event('gyn-plastico:session-expired'));
    }
    const messages: Record<number, string> = {
      401: 'Sua sessão expirou. Entre novamente.',
      403: 'Você não tem autorização para realizar esta ação. A pré-venda pode estar temporariamente desabilitada.',
      404: 'O registro ou produto solicitado não foi encontrado.',
      422: 'A API não aceitou os dados informados. Revise cliente, pagamento, parcela e produtos.',
      429: 'Muitas tentativas. Aguarde um pouco e tente novamente.',
    };
    throw new ApiError(
      messages[response.status] ?? (response.status >= 500 ? 'O serviço está temporariamente indisponível. Tente novamente mais tarde.' : 'Não foi possível concluir a solicitação.'),
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
