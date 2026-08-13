import { z } from 'zod';
import { dataResponseSchema } from './response.schema';

export const filialSchema = z.object({
  codigo: z.number().int().positive(),
  nome: z.string().min(1),
});

export const filiaisResponseSchema = dataResponseSchema(z.array(filialSchema));

export type Filial = z.infer<typeof filialSchema>;
export type FiliaisResponse = z.infer<typeof filiaisResponseSchema>;
