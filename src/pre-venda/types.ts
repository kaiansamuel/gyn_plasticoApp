export type Cliente = {
  codigo: number;
  nome: string;
  razaoSocial: string | null;
  cnpjCpf: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
};

export type Produto = {
  codigo: number;
  descricao: string;
  unidade: string | null;
  estoqueAtual: number;
  filialNome: string;
  valorUnitario: number;
};

export type CondicaoPagamento = {
  codigo: number;
  descricao: string;
  exigeParcela: boolean;
};

export type Parcela = { codigo: number; descricao: string };

export type Vendedor = { codigo: number; descricao: string; nomeCompleto: string | null };

export type ItemPreVenda = Produto & {
  quantidade: number;
  percentualDesconto: number;
};

export type PreVendaForm = {
  cliente: Cliente | null;
  formaPagamento: CondicaoPagamento | null;
  parcelaCodigo: number | null;
  observacao: string;
  vendedorCodigo: number;
  vendedor: Vendedor | null;
  itens: ItemPreVenda[];
};

export type PreVendaStep = 'cliente' | 'condicoes' | 'produtos' | 'carrinho' | 'revisao' | 'sucesso';

export function calcularItem(item: Pick<ItemPreVenda, 'quantidade' | 'valorUnitario' | 'percentualDesconto'>) {
  const bruto = item.quantidade * item.valorUnitario;
  const desconto = bruto * (item.percentualDesconto / 100);

  return { bruto, desconto, total: bruto - desconto };
}

export function calcularTotais(itens: ItemPreVenda[]) {
  return itens.reduce(
    (totais, item) => {
      const valores = calcularItem(item);
      return {
        bruto: totais.bruto + valores.bruto,
        desconto: totais.desconto + valores.desconto,
        total: totais.total + valores.total,
      };
    },
    { bruto: 0, desconto: 0, total: 0 },
  );
}
