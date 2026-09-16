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
  origemPreco?: 'TABELA_CLIENTE' | 'ESTOQUE';
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

export function formatarValorMonetario(valor: number) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseValorMonetario(valor: string): number | null {
  const texto = valor.trim();
  const usaVirgula = texto.includes(',');
  const formatoValido = usaVirgula
    ? /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(texto)
    : /^\d+(?:\.\d{1,2})?$/.test(texto);
  if (!formatoValido) return null;

  const numero = Number(usaVirgula ? texto.replaceAll('.', '').replace(',', '.') : texto);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

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
