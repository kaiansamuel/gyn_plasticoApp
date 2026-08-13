import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { ApiError } from '../api/client';
import { fetchClientes, fetchFormasPagamento, fetchParcelas, fetchProdutos, fetchVendedores, type CriarPreVendaPayload } from '../api/pre-venda';
import { ScreenHeader } from '../components/ScreenHeader';
import { calcularItem, calcularTotais, type Cliente, type ItemPreVenda, type PreVendaForm, type PreVendaStep, type Produto } from '../pre-venda/types';
import styles from './PreVendaScreen.module.css';

const steps: { id: Exclude<PreVendaStep, 'sucesso'>; label: string }[] = [
  { id: 'cliente', label: 'Cliente' },
  { id: 'condicoes', label: 'Condições' },
  { id: 'produtos', label: 'Produtos' },
  { id: 'carrinho', label: 'Itens' },
  { id: 'revisao', label: 'Revisão' },
];
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function PreVendaScreen() {
  const navigate = useNavigate();
  const { token, usuario } = useAuth();
  const [step, setStep] = useState<PreVendaStep>('cliente');
  const [form, setForm] = useState<PreVendaForm>({ cliente: null, formaPagamento: null, parcelaCodigo: null, observacao: '', vendedorCodigo: usuario?.vendedor.codigo ?? 0, vendedor: null, itens: [] });
  const [clienteBusca, setClienteBusca] = useState('');
  const [produtoBusca, setProdutoBusca] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [desconto, setDesconto] = useState(0);
  const [mensagem, setMensagem] = useState('');
  const [payload, setPayload] = useState<CriarPreVendaPayload | null>(null);
  const totais = useMemo(() => calcularTotais(form.itens), [form.itens]);
  const clienteQuery = useQuery({ queryKey: ['pre-venda', 'clientes', clienteBusca], queryFn: ({ signal }) => fetchClientes(token!, { busca: clienteBusca, limit: 20 }, signal), enabled: Boolean(token) && step === 'cliente' });
  const produtoQuery = useQuery({ queryKey: ['pre-venda', 'produtos', produtoBusca], queryFn: ({ signal }) => fetchProdutos(token!, produtoBusca.match(/^\d+$/) ? { produto: Number(produtoBusca), somenteComEstoque: true, limit: 20 } : { descricao: produtoBusca, somenteComEstoque: true, limit: 20 }, signal), enabled: Boolean(token) && step === 'produtos' });
  const formasQuery = useQuery({ queryKey: ['pre-venda', 'formas-pagamento'], queryFn: ({ signal }) => fetchFormasPagamento(token!, { limit: 100 }, signal), enabled: Boolean(token) && step === 'condicoes' });
  const parcelasQuery = useQuery({ queryKey: ['pre-venda', 'parcelas'], queryFn: ({ signal }) => fetchParcelas(token!, { limit: 100 }, signal), enabled: Boolean(token) && step === 'condicoes' && Boolean(form.formaPagamento?.exigeParcela) });
  const vendedoresQuery = useQuery({ queryKey: ['pre-venda', 'vendedores'], queryFn: ({ signal }) => fetchVendedores(token!, { limit: 100 }, signal), enabled: Boolean(token) && step === 'condicoes' && usuario?.vendedor.codigo === 0 });

  if (!usuario) return null;

  const clienteResultados = clienteQuery.data?.data ?? [];
  const produtoResultados = produtoQuery.data?.data ?? [];
  const formas = formasQuery.data?.data ?? [];
  const parcelas = parcelasQuery.data?.data ?? [];
  const vendedores = vendedoresQuery.data?.data ?? [];
  const stepIndex = steps.findIndex((item) => item.id === step);
  const vendedorFixoCodigo = usuario.vendedor.codigo;
  const fixedSeller = usuario.vendedor.codigo > 0 ? { codigo: usuario.vendedor.codigo, descricao: usuario.vendedor.nome ?? 'Vendedor vinculado', nomeCompleto: usuario.vendedor.nome } : null;
  const selectedSeller = fixedSeller ?? form.vendedor;

  function selectCliente(cliente: Cliente) { setForm((current) => ({ ...current, cliente })); setClienteBusca(cliente.nome); setMensagem(''); }
  function selectFormaPagamento(codigo: number) {
    const selected = formas.find((forma) => forma.codigo === codigo) ?? null;
    setForm((current) => ({ ...current, formaPagamento: selected, parcelaCodigo: selected?.exigeParcela ? null : 0 }));
    setPayload(null);
  }
  function addItem() {
    if (!produtoSelecionado || quantidade <= 0 || desconto < 0 || desconto > 100) { setMensagem('Informe um produto, uma quantidade válida e um desconto entre 0% e 100%.'); return; }
    setForm((current) => {
      const existing = current.itens.find((item) => item.codigo === produtoSelecionado.codigo);
      if (existing) return { ...current, itens: current.itens.map((item) => item.codigo === produtoSelecionado.codigo ? { ...item, quantidade: item.quantidade + quantidade, percentualDesconto: desconto } : item) };
      return { ...current, itens: [...current.itens, { ...produtoSelecionado, quantidade, percentualDesconto: desconto }] };
    });
    setProdutoSelecionado(null); setProdutoBusca(''); setQuantidade(1); setDesconto(0); setMensagem(''); setPayload(null);
  }
  function removeItem(codigo: number) { setForm((current) => ({ ...current, itens: current.itens.filter((item) => item.codigo !== codigo) })); setPayload(null); }
  function updateQuantity(item: ItemPreVenda, delta: number) { setForm((current) => ({ ...current, itens: current.itens.map((currentItem) => currentItem.codigo === item.codigo ? { ...currentItem, quantidade: Math.max(1, currentItem.quantidade + delta) } : currentItem) })); setPayload(null); }
  function next() {
    setMensagem('');
    if (step === 'cliente' && !form.cliente) { setMensagem('Selecione um cliente para continuar.'); return; }
    if (step === 'condicoes' && (!form.formaPagamento || (form.formaPagamento.exigeParcela && !form.parcelaCodigo) || (!selectedSeller && vendedorFixoCodigo === 0))) { setMensagem('Selecione a forma de pagamento, a parcela quando exigida e o vendedor.'); return; }
    if (step === 'produtos' && form.itens.length === 0) { setMensagem('Adicione pelo menos um produto.'); return; }
    if (stepIndex < steps.length - 1) setStep(steps[stepIndex + 1].id);
  }
  function buildPayload(): CriarPreVendaPayload | null {
    if (!form.cliente || !form.formaPagamento || !selectedSeller || (form.formaPagamento.exigeParcela && !form.parcelaCodigo)) return null;
    const now = new Date();
    return {
      clienteCodigo: form.cliente.codigo,
      clienteDescricao: form.cliente.nome,
      formaPagamentoCodigo: form.formaPagamento.codigo,
      parcelaCodigo: form.formaPagamento.exigeParcela ? form.parcelaCodigo! : 0,
      data: now.toISOString().slice(0, 10),
      hora: now.toTimeString().slice(0, 5),
      observacao: form.observacao.trim(),
      valorProdutos: totais.bruto,
      valorDesconto: totais.desconto,
      valorTotal: totais.total,
      vendedorCodigo: selectedSeller.codigo,
      itens: form.itens.map((item, index) => ({ produtoCodigo: item.codigo, sequencia: index + 1, descricao: item.descricao, quantidade: item.quantidade, valorUnitario: item.valorUnitario, valorTotal: calcularItem(item).total, percentualDesconto: item.percentualDesconto })),
    };
  }
  function validatePayload() {
    const nextPayload = buildPayload();
    if (!nextPayload) { setMensagem('Revise cliente, pagamento, parcela e vendedor antes de validar.'); return; }
    setPayload(nextPayload); setMensagem('Payload validado localmente. Nenhuma gravação foi executada.');
  }
  function back() { if (stepIndex > 0) setStep(steps[stepIndex - 1].id); else navigate('/vendas'); }
  function errorText(error: unknown) { return error instanceof ApiError ? error.message : 'Não foi possível carregar os dados. Tente novamente.'; }

  return (
    <div className={styles.page}>
      <ScreenHeader title="Nova pré-venda" onBack={back} />
      <main className={styles.content}>
        <div className={styles.demoBanner}>Modo seguro · a API de gravação está desabilitada. A revisão monta e valida o payload sem enviá-lo.</div>
        <nav className={styles.stepper} aria-label="Etapas da pré-venda">{steps.map((item, index) => <span key={item.id} className={index <= stepIndex ? styles.stepActive : ''}><b>{index + 1}</b>{item.label}</span>)}</nav>
        {step === 'cliente' ? <section><SectionTitle title="Escolha o cliente" subtitle="Pesquise por código ou nome real na API." /><SearchInput value={clienteBusca} onChange={setClienteBusca} placeholder="Buscar cliente" />{clienteQuery.isLoading ? <Loading /> : clienteQuery.isError ? <ErrorMessage message={errorText(clienteQuery.error)} /> : <Results>{clienteResultados.map((cliente) => <button type="button" key={cliente.codigo} className={`${styles.result} ${form.cliente?.codigo === cliente.codigo ? styles.selected : ''}`} onClick={() => selectCliente(cliente)}><span><strong>{cliente.nome}</strong><small>Código {cliente.codigo}{cliente.cidade ? ` · ${cliente.cidade}` : ''}</small></span>{form.cliente?.codigo === cliente.codigo ? <Check size={20} /> : null}</button>)}</Results>}</section> : null}
        {step === 'condicoes' ? <section><SectionTitle title="Condições da pré-venda" subtitle="A filial vem da sessão autenticada." /><InfoGrid><Info label="Cliente" value={`${form.cliente?.codigo} · ${form.cliente?.nome}`} /><Info label="Filial" value={`${usuario.filial.codigo} · ${usuario.filial.nome}`} /></InfoGrid>{usuario.vendedor.codigo > 0 ? <InfoGrid><Info label="Vendedor" value={`${usuario.vendedor.codigo} · ${usuario.vendedor.nome ?? 'Vendedor vinculado'}`} /></InfoGrid> : <><label className={styles.label} htmlFor="vendedor">Vendedor</label><select id="vendedor" className={styles.input} value={form.vendedor?.codigo ?? ''} onChange={(event) => setForm((current) => ({ ...current, vendedor: vendedores.find((vendedor) => vendedor.codigo === Number(event.target.value)) ?? null, vendedorCodigo: Number(event.target.value) || 0 }))}><option value="">Selecione</option>{vendedores.map((vendedor) => <option key={vendedor.codigo} value={vendedor.codigo}>{vendedor.codigo} · {vendedor.nomeCompleto ?? vendedor.descricao}</option>)}</select>{vendedoresQuery.isLoading ? <Loading /> : vendedoresQuery.isError ? <ErrorMessage message={errorText(vendedoresQuery.error)} /> : null}</>}<label className={styles.label} htmlFor="forma">Forma de pagamento</label>{formasQuery.isLoading ? <Loading /> : formasQuery.isError ? <ErrorMessage message={errorText(formasQuery.error)} /> : <select id="forma" className={styles.input} value={form.formaPagamento?.codigo ?? ''} onChange={(event) => selectFormaPagamento(Number(event.target.value))}><option value="">Selecione</option>{formas.map((forma) => <option key={forma.codigo} value={forma.codigo}>{forma.descricao}</option>)}</select>}{form.formaPagamento?.exigeParcela ? <><label className={styles.label} htmlFor="parcela">Parcela</label>{parcelasQuery.isLoading ? <Loading /> : parcelasQuery.isError ? <ErrorMessage message={errorText(parcelasQuery.error)} /> : <select id="parcela" className={styles.input} value={form.parcelaCodigo ?? ''} onChange={(event) => setForm((current) => ({ ...current, parcelaCodigo: Number(event.target.value) || null }))}><option value="">Selecione</option>{parcelas.map((parcela) => <option key={parcela.codigo} value={parcela.codigo}>{parcela.descricao}</option>)}</select>}</> : form.formaPagamento ? <p className={styles.helperMessage}>Esta forma não exige parcela. Será enviado <code>parcelaCodigo=0</code>.</p> : null}<label className={styles.label} htmlFor="observacao">Observação <small>(opcional)</small></label><textarea id="observacao" className={styles.input} rows={3} value={form.observacao} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} placeholder="Digite uma observação" /></section> : null}
        {step === 'produtos' ? <section><SectionTitle title="Adicione os produtos" subtitle="Preço inicial e estoque vêm da API." /><SearchInput value={produtoBusca} onChange={(value) => { setProdutoBusca(value); setProdutoSelecionado(null); }} placeholder="Buscar produto por código ou descrição" />{produtoQuery.isLoading ? <Loading /> : produtoQuery.isError ? <ErrorMessage message={errorText(produtoQuery.error)} /> : <Results>{produtoResultados.map((produto) => <button type="button" key={`${produto.codigo}-${produto.filialNome}`} className={`${styles.result} ${produtoSelecionado?.codigo === produto.codigo ? styles.selected : ''}`} onClick={() => setProdutoSelecionado(produto)}><span><strong>{produto.descricao}</strong><small>Código {produto.codigo} · {currency.format(produto.valorUnitario)} · Estoque {produto.estoqueAtual} {produto.unidade ?? ''}</small></span>{produtoSelecionado?.codigo === produto.codigo ? <Check size={20} /> : null}</button>)}</Results>}{produtoSelecionado ? <div className={styles.itemEditor}><strong>{produtoSelecionado.descricao}</strong><div className={styles.editorRow}><label className={styles.label} htmlFor="quantidade">Quantidade<input id="quantidade" className={styles.input} type="number" min="1" value={quantidade} onChange={(event) => setQuantidade(Number(event.target.value))} /></label><label className={styles.label} htmlFor="desconto">Desconto %<input id="desconto" className={styles.input} type="number" min="0" max="100" step="0.01" value={desconto} onChange={(event) => setDesconto(Number(event.target.value))} /></label></div><p className={styles.itemTotal}>Total: {currency.format(calcularItem({ ...produtoSelecionado, quantidade, percentualDesconto: desconto }).total)}</p><button type="button" className={styles.primaryButton} onClick={addItem}><Plus size={18} /> Adicionar item</button></div> : null}</section> : null}
        {step === 'carrinho' ? <section><SectionTitle title="Itens da pré-venda" subtitle="Revise quantidades e remova itens antes da revisão." />{form.itens.map((item) => <article className={styles.cartItem} key={item.codigo}><div><strong>{item.descricao}</strong><small>{item.codigo} · {item.quantidade} × {currency.format(item.valorUnitario)} · desconto {item.percentualDesconto}%</small></div><div className={styles.cartActions}><button type="button" aria-label={`Diminuir quantidade de ${item.descricao}`} onClick={() => updateQuantity(item, -1)}><Minus size={16} /></button><b>{item.quantidade}</b><button type="button" aria-label={`Aumentar quantidade de ${item.descricao}`} onClick={() => updateQuantity(item, 1)}><Plus size={16} /></button><button type="button" aria-label={`Remover ${item.descricao}`} className={styles.deleteButton} onClick={() => removeItem(item.codigo)}><Trash2 size={17} /></button></div><strong className={styles.lineTotal}>{currency.format(calcularItem(item).total)}</strong></article>)}<Totals totals={totais} /></section> : null}
        {step === 'revisao' ? <section><SectionTitle title="Revise antes de enviar" subtitle="Confira os dados e visualize o payload final." /><ReviewRow label="Cliente" value={`${form.cliente?.codigo} · ${form.cliente?.nome}`} /><ReviewRow label="Vendedor" value={selectedSeller ? `${selectedSeller.codigo} · ${selectedSeller.nomeCompleto ?? selectedSeller.descricao}` : 'Não selecionado'} /><ReviewRow label="Filial" value={`${usuario.filial.codigo} · ${usuario.filial.nome}`} /><ReviewRow label="Pagamento" value={`${form.formaPagamento?.descricao ?? 'Não selecionado'}${form.formaPagamento?.exigeParcela ? ` · ${parcelas.find((item) => item.codigo === form.parcelaCodigo)?.descricao ?? 'Parcela não selecionada'}` : ' · sem parcela'}`} /><ReviewRow label="Observação" value={form.observacao || 'Não informada'} /><Totals totals={totais} /><div className={styles.integrationNotice}>Validação local: o botão abaixo apenas monta o JSON. O service POST existe para a homologação, mas não é chamado agora.</div>{payload ? <div className={styles.payloadPreview}><strong>Payload que seria enviado</strong><pre>{JSON.stringify(payload, null, 2)}</pre></div> : null}</section> : null}
        {mensagem ? <p className={styles.errorMessage} role="status">{mensagem}</p> : null}
        <div className={styles.footerActions}>{step !== 'cliente' ? <button type="button" className={styles.secondaryButton} onClick={back}><ChevronLeft size={18} /> Voltar</button> : <button type="button" className={styles.secondaryButton} onClick={() => navigate('/vendas')}><ArrowLeft size={18} /> Cancelar</button>}{step === 'revisao' ? <button type="button" className={styles.primaryButton} onClick={validatePayload}><Check size={18} /> Validar payload</button> : <button type="button" className={styles.primaryButton} onClick={next}>Continuar <ArrowRight size={18} /></button>}</div>
      </main>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div className={styles.sectionTitle}><h1>{title}</h1><p>{subtitle}</p></div>; }
function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <input className={styles.input} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} />; }
function Results({ children }: { children: ReactNode }) { return <div className={styles.results}>{children}</div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><small>{label}</small><strong>{value}</strong></div>; }
function InfoGrid({ children }: { children: ReactNode }) { return <div className={styles.infoGrid}>{children}</div>; }
function ReviewRow({ label, value }: { label: string; value: string }) { return <div className={styles.reviewRow}><span>{label}</span><strong>{value}</strong></div>; }
function Totals({ totals }: { totals: { bruto: number; desconto: number; total: number } }) { return <div className={styles.totals}><span>Produtos <b>{currency.format(totals.bruto)}</b></span><span>Desconto <b>{currency.format(totals.desconto)}</b></span><span className={styles.grandTotal}>Total <b>{currency.format(totals.total)}</b></span></div>; }
function Loading() { return <p className={styles.helperMessage}>Carregando dados da API…</p>; }
function ErrorMessage({ message }: { message: string }) { return <p className={styles.errorMessage} role="alert">{message}</p>; }
