import { request } from './client';

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type TelefoneCliente = {
  sequencia: number;
  ddd: string | null;
  numero: string;
  tipo: string | null;
  contato: string | null;
};

export type ClienteConsulta = {
  clienteCodigo: number;
  cnpjCpf: string | null;
  nome: string;
  razaoSocial: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  telefones: TelefoneCliente[];
};
export type ClientesResponse = PaginatedResponse<ClienteConsulta>;

export type EstoqueConsulta = {
  codigoProduto: number;
  descricao: string;
  unidade: string | null;
  precoVenda: number;
  origemPreco?: 'TABELA_CLIENTE' | 'ESTOQUE';
  estoqueAtual: number;
  filialNome: string;
};
export type EstoquesResponse = PaginatedResponse<EstoqueConsulta>;

export type PedidoStatusCodigo = 'A' | 'C' | 'O' | 'D' | 'Z';

export type VendaConsulta = {
  numeroPedido: number;
  dataVenda: string;
  vendedorNome: string | null;
  clienteNome: string | null;
  valorPedido: number;
  filialNome: string;
  statusCodigo: PedidoStatusCodigo;
  statusDescricao: string;
};
export type VendasResponse = PaginatedResponse<VendaConsulta>;

export type SituacaoContaReceber = 'ABERTA' | 'PAGA' | 'VENCIDA';

export type ContaReceberConsulta = {
  numeroPedido: number;
  dataEmissao: string;
  dataVencimento: string;
  clienteNome: string | null;
  valor: number;
  situacao: SituacaoContaReceber;
  parcela: string;
};
export type ContasReceberResponse = PaginatedResponse<ContaReceberConsulta>;

export type ContaReceberDetalhe = ContaReceberConsulta & {
  vendedorNome: string | null;
  valorPago: number;
  valorRestante: number;
  filialNome: string;
};

type BaseQuery = { limit?: number; page?: number };

export type ClientesQuery = BaseQuery & { busca?: string; cidade?: number };
export type EstoquesQuery = BaseQuery & {
  clienteCodigo?: number;
  descricao?: string;
  produto?: number;
  somenteComEstoque?: boolean;
};
export type VendasQuery = BaseQuery & {
  cliente?: string;
  dataFinal: string;
  dataInicial: string;
  pedido?: number;
  status?: readonly PedidoStatusCodigo[];
  vendedor?: number;
};
export type ContasReceberQuery = BaseQuery & {
  cliente?: string;
  pedido?: number;
  situacao?: SituacaoContaReceber;
  vencimentoFinal: string;
  vencimentoInicial: string;
  vendedor?: number;
};

export function fetchClientes(
  token: string,
  query: ClientesQuery,
  signal?: AbortSignal,
): Promise<PaginatedResponse<ClienteConsulta>> {
  return request('/clientes', { params: query, signal, token });
}

export function fetchEstoques(
  token: string,
  query: EstoquesQuery,
  signal?: AbortSignal,
): Promise<PaginatedResponse<EstoqueConsulta>> {
  return request('/estoques', { params: query, signal, token });
}

export function fetchVendas(
  token: string,
  query: VendasQuery,
  signal?: AbortSignal,
): Promise<PaginatedResponse<VendaConsulta>> {
  return request('/vendas', { params: query, signal, token });
}

export function fetchContasReceber(
  token: string,
  query: ContasReceberQuery,
  signal?: AbortSignal,
): Promise<PaginatedResponse<ContaReceberConsulta>> {
  return request('/contas-receber', { params: query, signal, token });
}

export async function fetchContaReceberDetalhe(
  token: string,
  numeroPedido: number,
  parcela: string,
  signal?: AbortSignal,
): Promise<ContaReceberDetalhe> {
  const response = await request<{ data: ContaReceberDetalhe }>(
    `/contas-receber/${numeroPedido}/${encodeURIComponent(parcela)}`,
    { signal, token },
  );
  return response.data;
}
