import type { Filial, FiliaisResponse } from '../schemas/filial.schema';
import { request } from './client';

export async function fetchFiliais(signal?: AbortSignal): Promise<Filial[]> {
  const response = await request<FiliaisResponse>('/public/filiais', { signal });
  return response.data;
}
