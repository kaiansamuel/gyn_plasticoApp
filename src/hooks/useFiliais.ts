import { useQuery } from '@tanstack/react-query';
import { fetchFiliais } from '../api/filiais';

export function useFiliais() {
  return useQuery({
    queryKey: ['filiais'],
    queryFn: ({ signal }) => fetchFiliais(signal),
  });
}
