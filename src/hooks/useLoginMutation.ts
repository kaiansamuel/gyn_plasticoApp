import { useMutation } from '@tanstack/react-query';
import type { LoginRequest } from '../schemas/auth.schema';
import { useAuth } from '../auth/auth-context';

export function useLoginMutation() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: (request: LoginRequest) => login(request),
  });
}
