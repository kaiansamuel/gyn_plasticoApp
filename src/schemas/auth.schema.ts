import { z } from 'zod';
import { filialSchema } from './filial.schema';
import { dataResponseSchema } from './response.schema';

export const loginFormSchema = z.object({
  login: z.string().trim().min(1, 'Informe seu usuário.').max(100, 'Usuário muito longo.'),
  senha: z.string().min(1, 'Informe sua senha.').max(255, 'Senha muito longa.'),
  filial: z
    .number({ error: 'Selecione uma filial.' })
    .int('Selecione uma filial.')
    .positive('Selecione uma filial.'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type LoginRequest = LoginFormValues;

export const usuarioAutenticadoSchema = z.object({
  codigo: z.number().int().nonnegative(),
  nome: z.string().min(1),
  login: z.string().min(1),
  filial: filialSchema,
  vendedor: z.object({
    codigo: z.number().int().nonnegative(),
    nome: z.string().nullable(),
    acessoTodos: z.boolean(),
  }),
});

export const loginResponseSchema = dataResponseSchema(
  z.object({
    accessToken: z.string().min(1),
    expiresIn: z.number().int().positive(),
    usuario: usuarioAutenticadoSchema,
  }),
);

export const meResponseSchema = dataResponseSchema(usuarioAutenticadoSchema);

export type UsuarioAutenticado = z.infer<typeof usuarioAutenticadoSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
