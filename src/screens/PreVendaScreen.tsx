import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, LoaderCircle, Minus, Plus, Send, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { ApiError } from '../api/client';
import { createPreVenda, fetchClientes, fetchFormasPagamento, fetchParcelas, fetchProdutos, fetchVendedores, type CriarPreVendaPayload } from '../api/pre-venda';
import { ScreenHeader } from '../components/ScreenHeader';
import { calcularItem, calcularTotais, formatarValorMonetario, parseValorMonetario, type Cliente, type ItemPreVenda, type PreVendaForm, type PreVendaStep, type Produto } from '../pre-venda/types';
import styles from './PreVendaScreen.module.css';

const steps: { id: Exclude<PreVendaStep, 'sucesso'>; label: string }[] = [
  { id: 'cliente', label: 'Cliente' },
  { id: 'condicoes', label: 'Condições' },
  { id: 'produtos', label: 'Produtos' },
  { id: 'carrinho', label: 'Itens' },
  { id: 'revisao', label: 'Revisão' },
];
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const PRECO_INVALIDO_MESSAGE = 'Informe um preço unitário válido e maior que zero.';

export function PreVendaScreen() {
  const navigate = useNavigate();
  const { token, usuario } = useAuth();
  const [step, setStep] = useState<PreVendaStep>('cliente');
  const [form, setForm] = useState<PreVendaForm>({ cliente: null, formaPagamento: null, parcelaCodigo: null, observacao: '', vendedorCodigo: usuario?.vendedor.codigo ?? 0, vendedor: null, itens: [] });
  const [clienteBusca, setClienteBusca] = useState('');
  const [produtoBusca, setProdutoBusca] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [precoUnitario, setPrecoUnitario] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [mensagem, setMensagem] = useState('');
  const [payload, setPayload] = useState<CriarPreVendaPayload | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [numeroCriado, setNumeroCriado] = useState<number | null>(null);
  const envioEmAndamentoRef = useRef(false);
  const totais = useMemo(() => calcularTotais(form.itens), [form.itens]);
  const clienteQuery = useQuery({ queryKey: ['pre-venda', 'clientes', clienteBusca], queryFn: ({ signal }) => fetchClientes(token!, { busca: clienteBusca, limit: 20 }, signal), enabled: Boolean(token) && step === 'cliente' });
  const produtoQuery = useQuery({ queryKey: ['pre-venda', 'produtos', form.cliente?.codigo, produtoBusca], queryFn: ({ signal }) => fetchProdutos(token!, produtoBusca.match(/^\d+$/) ? { produto: Number(produtoBusca), clienteCodigo: form.cliente!.codigo, somenteComEstoque: true, limit: 20 } : { descricao: produtoBusca, clienteCodigo: form.cliente!.codigo, somenteComEstoque: true, limit: 20 }, signal), enabled: Boolean(token) && step === 'produtos' && Boolean(form.cliente) && Boolean(produtoBusca.trim()) });
  const formasQuery = useQuery({ queryKey: ['pre-venda', 'formas-pagamento'], queryFn: ({ signal }) => fetchFormasPagamento(token!, { limit: 100 }, signal), enabled: Boolean(token) && step === 'condicoes' });
  const parcelasQuery = useQuery({ queryKey: ['pre-venda', 'parcelas'], queryFn: ({ signal }) => fetchParcelas(token!, { limit: 100 }, signal), enabled: Boolean(token) && step === 'condicoes' && Boolean(form.formaPagamento?.exigeParcela) });
  const vendedoresQuery = useQuery({ queryKey: ['pre-venda', 'vendedores'], queryFn: ({ signal }) => fetchVendedores(token!, { limit: 100 }, signal), enabled: Boolean(token) && step === 'condicoes' && usuario?.vendedor.codigo === 0 });

  if (!usuario) return null;

  const clienteResultados = clienteQuery.data?.data ?? [];
  const produtoResultados = form.cliente && produtoBusca.trim() ? produtoQuery.data?.data ?? [] : [];
  const formas = formasQuery.data?.data ?? [];
  const parcelas = parcelasQuery.data?.data ?? [];
  const vendedores = vendedoresQuery.data?.data ?? [];
  const stepIndex = steps.findIndex((item) => item.id === step);
  const vendedorFixoCodigo = usuario.vendedor.codigo;
  const fixedSeller = usuario.vendedor.codigo > 0 ? { codigo: usuario.vendedor.codigo, descricao: usuario.vendedor.nome ?? 'Vendedor vinculado', nomeCompleto: usuario.vendedor.nome } : null;
  const selectedSeller = fixedSeller ?? form.vendedor;
  const valorUnitario = parseValorMonetario(precoUnitario);
  const quantidadeValida = Number.isFinite(quantidade) && quantidade > 0;

  function clearProdutos() { setProdutoBusca(''); setProdutoSelecionado(null); setPrecoUnitario(''); setQuantidade(1); setPayload(null); }
  function selectCliente(cliente: Cliente) {
    if (form.cliente?.codigo !== cliente.codigo) {
      setForm((current) => ({ ...current, cliente, itens: [] }));
      clearProdutos();
    }
    setClienteBusca(cliente.nome);
    setMensagem('');
  }
  function changeClienteBusca(value: string) {
    setClienteBusca(value);
    if (form.cliente && value !== form.cliente.nome) {
      setForm((current) => ({ ...current, cliente: null, itens: [] }));
      clearProdutos();
    }
    setMensagem('');
  }
  function selectFormaPagamento(codigo: number) {
    const selected = formas.find((forma) => forma.codigo === codigo) ?? null;
    setForm((current) => ({ ...current, formaPagamento: selected, parcelaCodigo: selected?.exigeParcela ? null : 0 }));
    setPayload(null);
  }
  function selectProduto(produto: Produto) {
    setProdutoSelecionado(produto);
    setPrecoUnitario(Number.isFinite(produto.valorUnitario) && produto.valorUnitario > 0 ? formatarValorMonetario(produto.valorUnitario) : '');
    setMensagem('');
  }
  function changeQuantidade(delta: number) {
    setQuantidade((current) => Math.max(1, current + delta));
    setMensagem('');
  }
  function addItem() {
    if (produtoSelecionado && valorUnitario === null) { setMensagem(PRECO_INVALIDO_MESSAGE); return; }
    if (!produtoSelecionado || !quantidadeValida) { setMensagem('Informe um produto e uma quantidade válida.'); return; }
    setForm((current) => {
      const existing = current.itens.find((item) => item.codigo === produtoSelecionado.codigo);
      if (existing) return { ...current, itens: current.itens.map((item) => item.codigo === produtoSelecionado.codigo ? { ...item, quantidade: item.quantidade + quantidade, valorUnitario: valorUnitario!, percentualDesconto: 0 } : item) };
      return { ...current, itens: [...current.itens, { ...produtoSelecionado, quantidade, valorUnitario: valorUnitario!, percentualDesconto: 0 }] };
    });
    setProdutoSelecionado(null); setProdutoBusca(''); setPrecoUnitario(''); setQuantidade(1); setMensagem(''); setPayload(null);
  }
  function removeItem(codigo: number) { setForm((current) => ({ ...current, itens: current.itens.filter((item) => item.codigo !== codigo) })); setPayload(null); }
  function updateQuantity(item: ItemPreVenda, delta: number) { setForm((current) => ({ ...current, itens: current.itens.map((currentItem) => currentItem.codigo === item.codigo ? { ...currentItem, quantidade: Math.max(1, currentItem.quantidade + delta) } : currentItem) })); setPayload(null); }
  function next() {
    setMensagem('');
    if (step === 'cliente' && !form.cliente) { setMensagem('Selecione um cliente para continuar.'); return; }
    if (step === 'condicoes' && !form.formaPagamento) { setMensagem('Selecione uma forma de pagamento para continuar.'); return; }
    if (step === 'condicoes' && form.formaPagamento?.exigeParcela && !form.parcelaCodigo) { setMensagem('Selecione uma parcela para esta forma de pagamento.'); return; }
    if (step === 'condicoes' && !selectedSeller && vendedorFixoCodigo === 0) { setMensagem('Selecione um vendedor para continuar.'); return; }
    if (step === 'produtos' && form.itens.length === 0) { setMensagem('Adicione pelo menos um produto.'); return; }
    if (hasInvalidPriceItem(form.itens)) { setMensagem(PRECO_INVALIDO_MESSAGE); return; }
    if (stepIndex < steps.length - 1) setStep(steps[stepIndex + 1].id);
  }
  function buildPayload(): CriarPreVendaPayload | null {
    if (!form.cliente || !form.formaPagamento || !selectedSeller || (form.formaPagamento.exigeParcela && !form.parcelaCodigo) || hasInvalidPriceItem(form.itens)) return null;
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
  async function sendPreVenda() {
    if (envioEmAndamentoRef.current) return;
    setMensagem('');
    if (hasInvalidPriceItem(form.itens)) { setMensagem(PRECO_INVALIDO_MESSAGE); return; }
    const nextPayload = buildPayload();
    if (!nextPayload) { setMensagem('Revise cliente, pagamento, parcela e vendedor antes de enviar.'); return; }
    if (!token) { setMensagem('Sessão expirada. Faça login novamente para enviar a pré-venda.'); return; }

    envioEmAndamentoRef.current = true;
    setEnviando(true);
    try {
      await createPreVenda(token, nextPayload);
      setStep('cliente');
      setForm({ cliente: null, formaPagamento: null, parcelaCodigo: null, observacao: '', vendedorCodigo: usuario.vendedor.codigo, vendedor: null, itens: [] });
      setClienteBusca('');
      setProdutoBusca('');
      setProdutoSelecionado(null);
      setPrecoUnitario('');
      setQuantidade(1);
      setMensagem('');
      setPayload(null);
      setNumeroCriado(null);
      navigate('/', { replace: true });
    } catch (error) {
      setNumeroCriado(null);
      setMensagem(error instanceof ApiError ? error.message : 'Não foi possível enviar a pré-venda. Tente novamente.');
      envioEmAndamentoRef.current = false;
      setEnviando(false);
    }
  }
  function back() { if (stepIndex > 0) setStep(steps[stepIndex - 1].id); else navigate('/vendas'); }
  function errorText(error: unknown) { return error instanceof ApiError ? error.message : 'Não foi possível carregar os dados. Tente novamente.'; }

  return (
    <div className={styles.page}>
      <ScreenHeader title="Nova pré-venda" onBack={back} />
      <main className={styles.content}>
        <nav className={styles.stepper} aria-label="Etapas da pré-venda">{steps.map((item, index) => <span key={item.id} className={index <= stepIndex ? styles.stepActive : ''}><b>{index + 1}</b>{item.label}</span>)}</nav>
        {step === 'cliente' ? <section><SectionTitle title="Escolha o cliente" subtitle="Pesquise por código ou nome real na API." /><SearchInput value={clienteBusca} onChange={changeClienteBusca} placeholder="Buscar cliente" />{clienteQuery.isLoading ? <Loading /> : clienteQuery.isError ? <ErrorMessage message={errorText(clienteQuery.error)} /> : <Results>{clienteResultados.map((cliente) => <button type="button" key={cliente.codigo} className={`${styles.result} ${form.cliente?.codigo === cliente.codigo ? styles.selected : ''}`} onClick={() => selectCliente(cliente)}><span><strong>{cliente.nome}</strong><small>Código {cliente.codigo}{cliente.cidade ? ` · ${cliente.cidade}` : ''}</small></span>{form.cliente?.codigo === cliente.codigo ? <Check size={20} /> : null}</button>)}</Results>}</section> : null}
        {step === 'condicoes' ? <section><SectionTitle title="Condições da pré-venda" subtitle="A filial vem da sessão autenticada." /><InfoGrid><Info label="Cliente" value={`${form.cliente?.codigo} · ${form.cliente?.nome}`} /><Info label="Filial" value={`${usuario.filial.codigo} · ${usuario.filial.nome}`} /></InfoGrid>{usuario.vendedor.codigo > 0 ? <InfoGrid><Info label="Vendedor" value={`${usuario.vendedor.codigo} · ${usuario.vendedor.nome ?? 'Vendedor vinculado'}`} /></InfoGrid> : <><label className={styles.label} htmlFor="vendedor">Vendedor</label><select id="vendedor" className={styles.input} value={form.vendedor?.codigo ?? ''} onChange={(event) => setForm((current) => ({ ...current, vendedor: vendedores.find((vendedor) => vendedor.codigo === Number(event.target.value)) ?? null, vendedorCodigo: Number(event.target.value) || 0 }))}><option value="">Selecione</option>{vendedores.map((vendedor) => <option key={vendedor.codigo} value={vendedor.codigo}>{vendedor.codigo} · {vendedor.nomeCompleto ?? vendedor.descricao}</option>)}</select>{vendedoresQuery.isLoading ? <Loading /> : vendedoresQuery.isError ? <ErrorMessage message={errorText(vendedoresQuery.error)} /> : null}</>}<label className={styles.label} htmlFor="forma">Forma de pagamento</label>{formasQuery.isLoading ? <Loading /> : formasQuery.isError ? <ErrorMessage message={errorText(formasQuery.error)} /> : <select id="forma" className={styles.input} value={form.formaPagamento?.codigo ?? ''} onChange={(event) => selectFormaPagamento(Number(event.target.value))}><option value="">Selecione</option>{formas.map((forma) => <option key={forma.codigo} value={forma.codigo}>{forma.descricao}</option>)}</select>}{form.formaPagamento?.exigeParcela ? <><label className={styles.label} htmlFor="parcela">Parcela</label>{parcelasQuery.isLoading ? <Loading /> : parcelasQuery.isError ? <ErrorMessage message={errorText(parcelasQuery.error)} /> : <select id="parcela" className={styles.input} value={form.parcelaCodigo ?? ''} onChange={(event) => setForm((current) => ({ ...current, parcelaCodigo: Number(event.target.value) || null }))} required><option value="">Selecione</option>{parcelas.map((parcela) => <option key={parcela.codigo} value={parcela.codigo}>{parcela.descricao}</option>)}</select>}</> : form.formaPagamento ? <p className={styles.helperMessage}>Esta forma não exige parcela. Será enviado <code>parcelaCodigo=0</code>.</p> : null}<label className={styles.label} htmlFor="observacao">Observação <small>(opcional)</small></label><textarea id="observacao" className={styles.input} rows={3} value={form.observacao} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} placeholder="Digite uma observação" /></section> : null}
        {step === 'produtos' ? <section><SectionTitle title="Adicione os produtos" subtitle="Preço inicial e estoque vêm da API." /><SearchInput value={produtoBusca} onChange={(value) => { setProdutoBusca(value); setProdutoSelecionado(null); setPrecoUnitario(''); }} placeholder="Buscar produto por código ou descrição" />{produtoQuery.isLoading ? <Loading /> : produtoQuery.isError ? <ErrorMessage message={errorText(produtoQuery.error)} /> : <Results>{produtoResultados.map((produto) => <button type="button" key={`${produto.codigo}-${produto.filialNome}`} className={`${styles.result} ${produtoSelecionado?.codigo === produto.codigo ? styles.selected : ''}`} onClick={() => selectProduto(produto)}><span><strong>{produto.descricao}</strong><small>Código {produto.codigo} · {produto.valorUnitario > 0 ? currency.format(produto.valorUnitario) : "Preço a informar"} · Estoque {produto.estoqueAtual} {produto.unidade ?? ''}</small></span>{produtoSelecionado?.codigo === produto.codigo ? <Check size={20} /> : null}</button>)}</Results>}{produtoSelecionado ? <div className={styles.itemEditor}><strong>{produtoSelecionado.descricao}</strong><div className={styles.editorRow}><div className={styles.label}><label htmlFor="quantidade">Quantidade</label><div className={styles.quantityControl}><button type="button" aria-label="Diminuir quantidade" onClick={() => changeQuantidade(-1)} disabled={quantidade <= 1}><Minus size={16} /></button><input id="quantidade" className={styles.input} type="number" min="1" step="any" value={quantidade} onChange={(event) => { const nextQuantidade = Number(event.target.value); if (Number.isFinite(nextQuantidade) && nextQuantidade >= 1) setQuantidade(nextQuantidade); setMensagem(''); }} /><button type="button" aria-label="Aumentar quantidade" onClick={() => changeQuantidade(1)}><Plus size={16} /></button></div></div><label className={styles.label} htmlFor="precoUnitario">Preço unitário<input id="precoUnitario" className={styles.input} type="text" inputMode="decimal" value={precoUnitario} onChange={(event) => { setPrecoUnitario(event.target.value); setMensagem(''); }} aria-invalid={precoUnitario !== '' && valorUnitario === null} /></label></div><p className={styles.itemTotal}>Total: {valorUnitario === null || !quantidadeValida ? '—' : currency.format(calcularItem({ quantidade, valorUnitario, percentualDesconto: 0 }).total)}</p><button type="button" className={styles.primaryButton} onClick={addItem}><Plus size={18} /> Adicionar item</button></div> : null}</section> : null}
        {step === 'carrinho' ? <section><SectionTitle title="Itens da pré-venda" subtitle="Revise quantidades e remova itens antes da revisão." />{form.itens.map((item) => <article className={styles.cartItem} key={item.codigo}><div><strong>{item.descricao}</strong><small>{item.codigo} · {item.quantidade} × {currency.format(item.valorUnitario)} · desconto {item.percentualDesconto}%</small></div><div className={styles.cartActions}><button type="button" aria-label={`Diminuir quantidade de ${item.descricao}`} onClick={() => updateQuantity(item, -1)}><Minus size={16} /></button><b>{item.quantidade}</b><button type="button" aria-label={`Aumentar quantidade de ${item.descricao}`} onClick={() => updateQuantity(item, 1)}><Plus size={16} /></button><button type="button" aria-label={`Remover ${item.descricao}`} className={styles.deleteButton} onClick={() => removeItem(item.codigo)}><Trash2 size={17} /></button></div><strong className={styles.lineTotal}>{currency.format(calcularItem(item).total)}</strong></article>)}<Totals totals={totais} /></section> : null}
        {step === 'revisao' ? <section><SectionTitle title="Revise antes de enviar" subtitle="Confira os dados e visualize o payload final." /><ReviewRow label="Cliente" value={`${form.cliente?.codigo} · ${form.cliente?.nome}`} /><ReviewRow label="Vendedor" value={selectedSeller ? `${selectedSeller.codigo} · ${selectedSeller.nomeCompleto ?? selectedSeller.descricao}` : 'Não selecionado'} /><ReviewRow label="Filial" value={`${usuario.filial.codigo} · ${usuario.filial.nome}`} /><ReviewRow label="Pagamento" value={`${form.formaPagamento?.descricao ?? 'Não selecionado'}${form.formaPagamento?.exigeParcela ? ` · ${parcelas.find((item) => item.codigo === form.parcelaCodigo)?.descricao ?? 'Parcela não selecionada'}` : ' · sem parcela'}`} /><ReviewRow label="Observação" value={form.observacao || 'Não informada'} /><Totals totals={totais} /><div className={styles.integrationNotice}>O botão abaixo enviará a pré-venda para a API usando a sessão autenticada.</div>{payload ? <div className={styles.payloadPreview}><strong>Payload enviado</strong><pre>{JSON.stringify(payload, null, 2)}</pre></div> : null}</section> : null}
        {mensagem ? <p className={numeroCriado !== null ? styles.successMessage : styles.errorMessage} role="status">{mensagem}</p> : null}
        <div className={styles.footerActions}>{step !== 'cliente' ? <button type="button" className={styles.secondaryButton} onClick={back} disabled={enviando}><ChevronLeft size={18} /> Voltar</button> : <button type="button" className={styles.secondaryButton} onClick={() => navigate('/vendas')} disabled={enviando}><ArrowLeft size={18} /> Cancelar</button>}{step === 'revisao' ? <button type="button" className={styles.primaryButton} onClick={sendPreVenda} disabled={enviando}>{enviando ? <><LoaderCircle size={18} className={styles.spinner} /> Enviando...</> : <><Send size={18} /> Enviar pré-venda</>}</button> : <button type="button" className={styles.primaryButton} onClick={next}>Continuar <ArrowRight size={18} /></button>}</div>
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

function hasInvalidPriceItem(itens: ItemPreVenda[]) { return itens.some((item) => !Number.isFinite(item.valorUnitario) || item.valorUnitario <= 0); }
