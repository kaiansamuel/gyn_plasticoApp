import { z } from 'zod';

export function dataResponseSchema<T extends z.ZodTypeAny>(schema: T) {
  return z.object({ data: schema });
}
