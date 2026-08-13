import type { Cliente, CondicaoPagamento, Produto } from './types';

// Dados temporários para permitir a validação visual enquanto os endpoints de consulta são definidos pela API.
export const clientesDemo: Cliente[] = [
  { codigo: 101, nome: 'Mercado São Paulo Ltda.', razaoSocial: null, cnpjCpf: null, endereco: null, bairro: null, cidade: null },
  { codigo: 205, nome: 'Comercial Boa Compra', razaoSocial: null, cnpjCpf: null, endereco: null, bairro: null, cidade: null },
  { codigo: 318, nome: 'Padaria Pão da Praça', razaoSocial: null, cnpjCpf: null, endereco: null, bairro: null, cidade: null },
];

export const produtosDemo: Produto[] = [
  { codigo: 1001, descricao: 'Café torrado 500g', unidade: 'UN', estoqueAtual: 0, filialNome: 'Demo', valorUnitario: 18.9 },
  { codigo: 1002, descricao: 'Açúcar refinado 1kg', unidade: 'UN', estoqueAtual: 0, filialNome: 'Demo', valorUnitario: 5.49 },
  { codigo: 1003, descricao: 'Biscoito água e sal 350g', unidade: 'UN', estoqueAtual: 0, filialNome: 'Demo', valorUnitario: 6.75 },
  { codigo: 1004, descricao: 'Leite integral 1L', unidade: 'UN', estoqueAtual: 0, filialNome: 'Demo', valorUnitario: 5.99 },
];

export const condicoesDemo: CondicaoPagamento[] = [
  { codigo: 1, descricao: 'À vista', exigeParcela: false },
  { codigo: 2, descricao: 'Boleto bancário', exigeParcela: true },
];
