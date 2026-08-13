import type { LoginRequest, LoginResponse, MeResponse, UsuarioAutenticado } from '../schemas/auth.schema';
import { request } from './client';

export async function login(requestBody: LoginRequest): Promise<LoginResponse['data']> {
  const response = await request<LoginResponse>('/auth/login', {
    body: requestBody,
    method: 'POST',
  });
  return response.data;
}

export async function fetchCurrentUser(token: string): Promise<UsuarioAutenticado> {
  const response = await request<MeResponse>('/auth/me', { token });
  return response.data;
}
