import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Camera, Check, ChevronLeft, LoaderCircle, Minus, Plus, Send, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { ApiError } from '../api/client';
import { createPreVenda, fetchClientes, fetchFormasPagamento, fetchParcelas, fetchProdutos, fetchVendedores, type CriarPreVendaPayload } from '../api/pre-venda';
import { ScreenHeader } from '../components/ScreenHeader';
import { resolverProduto } from '../api/consultas';
import { scanProductIdentifier } from '../utils/barcode-scanner';
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
const PRECO_INVALIDO_MESSAGE = 'Informe um preço unitário válido e maior que zero.';
const CLIENTE_BLOQUEADO_MESSAGE = 'Cliente bloqueado. Não é permitida a realização de venda.';
const RESTRICAO_VENDA_PRAZO_MESSAGE = 'Cliente possui restrição para venda a prazo.';

export function PreVendaScreen() {
  const navigate = useNavigate();
  const { token, usuario } = useAuth();
  const [step, setStep] = useState<PreVendaStep>('cliente');
  const [form, setForm] = useState<PreVendaForm>({ cliente: null, formaPagamento: null, parcelaCodigo: null, observacao: '', vendedorCodigo: usuario?.vendedor.codigo ?? 0, vendedor: null, itens: [] });
  const [clienteBusca, setClienteBusca] = useState('');
  const [produtoBusca, setProdutoBusca] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [precoSelecionado, setPrecoSelecionado] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [percentualDesconto, setPercentualDesconto] = useState(0);
  const [dataPreVenda, setDataPreVenda] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [horaPreVenda, setHoraPreVenda] = useState(() => new Date().toTimeString().slice(0, 5));
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [numeroCriado, setNumeroCriado] = useState<number | null>(null);
  const envioEmAndamentoRef = useRef(false);
  const totais = useMemo(() => calcularTotais(form.itens), [form.itens]);
  const clienteQuery = useQuery({ queryKey: ['pre-venda', 'clientes', clienteBusca], queryFn: ({ signal }) => fetchClientes(token!, { busca: clienteBusca, limit: 20 }, signal), enabled: Boolean(token) && step === 'cliente' });
  const produtoQuery = useQuery({ queryKey: ['pre-venda', 'produtos', form.cliente?.codigo, produtoBusca], queryFn: ({ signal }) => fetchProdutos(token!, produtoBusca.match(/^\d+$/) ? { produto: Number(produtoBusca), clienteCodigo: form.cliente!.codigo, somenteComEstoque: true, limit: 20 } : { descricao: produtoBusca, clienteCodigo: form.cliente!.codigo, somenteComEstoque: true, limit: 20 }, signal), enabled: Boolean(token) && step === 'produtos' && Boolean(form.cliente) && Boolean(produtoBusca.trim()) });
  const resolverMutation = useMutation({ mutationFn: (identificador: string) => resolverProduto(token!, identificador) });
  const createMutation = useMutation({ mutationFn: (request: CriarPreVendaPayload) => createPreVenda(token!, request) });
  const formasQuery = useQuery({ queryKey: ['pre-venda', 'formas-pagamento'], queryFn: ({ signal }) => fetchFormasPagamento(token!, { limit: 100 }, signal), enabled: Boolean(token) && step === 'condicoes' });
  const parcelasQuery = useQuery({ queryKey: ['pre-venda', 'parcelas'], queryFn: ({ signal }) => fetchParcelas(token!, { limit: 100 }, signal), enabled: Boolean(token) && step === 'condicoes' && Boolean(form.formaPagamento?.exigeParcela) });
  const vendedoresQuery = useQuery({ queryKey: ['pre-venda', 'vendedores'], queryFn: ({ signal }) => fetchVendedores(token!, { limit: 100 }, signal), enabled: Boolean(token) && step === 'condicoes' });

  if (!usuario) return null;

  const clienteResultados = clienteQuery.data?.data ?? [];
  const produtoResultados = form.cliente && produtoBusca.trim() ? produtoQuery.data?.data ?? [] : [];
  const formas = formasQuery.data?.data ?? [];
  const parcelas = parcelasQuery.data?.data ?? [];
  const vendedores = vendedoresQuery.data?.data ?? [];
  const stepIndex = steps.findIndex((item) => item.id === step);
  const selectedSeller = form.vendedor;
  const produtoPrecos = produtoSelecionado ? [produtoSelecionado.precoVenda, produtoSelecionado.precoVenda1, produtoSelecionado.precoVenda2, produtoSelecionado.precoVenda3] : [];
  const valorUnitario = precoSelecionado === null ? null : produtoPrecos[precoSelecionado] ?? null;
  const quantidadeValida = Number.isFinite(quantidade) && quantidade > 0;
  const clienteBloqueado = form.cliente?.bloqueado === true;
  const possuiRestricaoVendaPrazo = form.cliente?.bloqueiaVendaPrazo === true && form.formaPagamento?.exigeParcela === true;

  function clearProdutos() { setProdutoBusca(''); setProdutoSelecionado(null); setPrecoSelecionado(null); setQuantidade(1); }
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
    setMensagem('');
  }
  function selectProduto(produto: Produto) {
    setProdutoSelecionado(produto);
    setPrecoSelecionado(null);
    setMensagem('');
  }
  async function scanProduto() {
    try {
      const identificador = await scanProductIdentifier();
      if (!identificador || !token) return;
      resolverMutation.mutate(identificador, { onSuccess: (produto) => { selectProduto({ ...produto, codigo: produto.codigoProduto }); setProdutoBusca(''); } });
    } catch {
      setMensagem('Não foi possível abrir a câmera. Você pode pesquisar o produto manualmente.');
    }
  }
  function changeQuantidade(delta: number) {
    setQuantidade((current) => Math.max(1, current + delta));
    setMensagem('');
  }
  function setItemDiscount(value: number) { setPercentualDesconto(Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))); }
  function addItem() {
    if (produtoSelecionado && (valorUnitario === null || valorUnitario <= 0)) { setMensagem(PRECO_INVALIDO_MESSAGE); return; }
    if (!produtoSelecionado || !quantidadeValida) { setMensagem('Informe um produto e uma quantidade válida.'); return; }
    setForm((current) => {
      const existing = current.itens.find((item) => item.codigo === produtoSelecionado.codigo && item.precoSelecionado === precoSelecionado! + 1);
      if (existing) return { ...current, itens: current.itens.map((item) => item.codigo === existing.codigo && item.precoSelecionado === existing.precoSelecionado ? { ...item, quantidade: item.quantidade + quantidade, percentualDesconto } : item) };
      return { ...current, itens: [...current.itens, { ...produtoSelecionado, quantidade, valorUnitario: valorUnitario!, precoSelecionado: precoSelecionado! + 1, percentualDesconto }] };
    });
    setProdutoSelecionado(null); setProdutoBusca(''); setPrecoSelecionado(null); setQuantidade(1); setPercentualDesconto(0); setMensagem('');
  }
  function removeItem(itemToRemove: ItemPreVenda) { setForm((current) => ({ ...current, itens: current.itens.filter((item) => !(item.codigo === itemToRemove.codigo && item.precoSelecionado === itemToRemove.precoSelecionado)) })); }
  function updateQuantity(item: ItemPreVenda, delta: number) { setForm((current) => ({ ...current, itens: current.itens.map((currentItem) => currentItem.codigo === item.codigo && currentItem.precoSelecionado === item.precoSelecionado ? { ...currentItem, quantidade: Math.max(1, currentItem.quantidade + delta) } : currentItem) })); }
  function next() {
    setMensagem('');
    if (step === 'cliente' && !form.cliente) { setMensagem('Selecione um cliente para continuar.'); return; }
    if (step === 'cliente' && clienteBloqueado) { setMensagem(CLIENTE_BLOQUEADO_MESSAGE); return; }
    if (step === 'condicoes' && !form.formaPagamento) { setMensagem('Selecione uma forma de pagamento para continuar.'); return; }
    if (step === 'condicoes' && form.formaPagamento?.exigeParcela && !form.parcelaCodigo) { setMensagem('Selecione uma parcela para esta forma de pagamento.'); return; }
    if (step === 'condicoes' && !selectedSeller) { setMensagem('Selecione um vendedor para continuar.'); return; }
    if (step === 'produtos' && form.itens.length === 0) { setMensagem('Adicione pelo menos um produto.'); return; }
    if (hasInvalidPriceItem(form.itens)) { setMensagem(PRECO_INVALIDO_MESSAGE); return; }
    if (stepIndex < steps.length - 1) setStep(steps[stepIndex + 1].id);
  }
  function buildPayload(): CriarPreVendaPayload | null {
    if (!form.cliente || form.cliente.bloqueado || !form.formaPagamento || !selectedSeller || (form.formaPagamento.exigeParcela && !form.parcelaCodigo) || hasInvalidPriceItem(form.itens) || !dataPreVenda || !horaPreVenda) return null;
    return {
      clienteCodigo: form.cliente.codigo,
      clienteDescricao: form.cliente.nome,
      formaPagamentoCodigo: form.formaPagamento.codigo,
      parcelaCodigo: form.formaPagamento.exigeParcela ? form.parcelaCodigo! : 0,
      data: dataPreVenda,
      hora: horaPreVenda,
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
    if (clienteBloqueado) { setMensagem(CLIENTE_BLOQUEADO_MESSAGE); return; }
    if (hasInvalidPriceItem(form.itens)) { setMensagem(PRECO_INVALIDO_MESSAGE); return; }
    const nextPayload = buildPayload();
    if (!nextPayload) { setMensagem('Revise cliente, pagamento, parcela e vendedor antes de enviar.'); return; }
    if (!token) { setMensagem('Sessão expirada. Faça login novamente para enviar a pré-venda.'); return; }

    envioEmAndamentoRef.current = true;
    setEnviando(true);
    try {
      await createMutation.mutateAsync(nextPayload);
      setStep('cliente');
      setForm({ cliente: null, formaPagamento: null, parcelaCodigo: null, observacao: '', vendedorCodigo: usuario.vendedor.codigo, vendedor: null, itens: [] });
      setClienteBusca('');
      setProdutoBusca('');
      setProdutoSelecionado(null);
      setPrecoSelecionado(null);
      setQuantidade(1);
      setMensagem('');
      setNumeroCriado(null);
      navigate('/', { replace: true });
    } catch (error) {
      setNumeroCriado(null);
      if (error instanceof ApiError && error.statusCode === 422 && error.code === 'CLIENTE_BLOQUEADO') {
        setMensagem(CLIENTE_BLOQUEADO_MESSAGE);
      } else {
        setMensagem(error instanceof ApiError ? error.message : 'Não foi possível enviar a pré-venda. Tente novamente.');
      }
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
        {step === 'cliente' ? <section><SectionTitle title="Escolha o cliente" subtitle="Pesquise por código ou nome real na API." /><SearchInput value={clienteBusca} onChange={changeClienteBusca} placeholder="Buscar cliente" />{clienteQuery.isLoading ? <Loading /> : clienteQuery.isError ? <ErrorMessage message={errorText(clienteQuery.error)} /> : <Results>{clienteResultados.map((cliente) => <button type="button" key={cliente.codigo} className={`${styles.result} ${form.cliente?.codigo === cliente.codigo ? styles.selected : ''}`} onClick={() => selectCliente(cliente)}><span><strong>{cliente.nome}</strong><small>Código {cliente.codigo}{cliente.cidade ? ` · ${cliente.cidade}` : ''}</small>{cliente.bloqueado ? <em className={`${styles.clientBadge} ${styles.blockedBadge}`}>Bloqueado</em> : cliente.bloqueiaVendaPrazo ? <em className={`${styles.clientBadge} ${styles.termRestrictionBadge}`}>Restrição a prazo</em> : null}</span>{form.cliente?.codigo === cliente.codigo ? <Check size={20} /> : null}</button>)}</Results>}{clienteBloqueado ? <ErrorMessage message={CLIENTE_BLOQUEADO_MESSAGE} /> : null}</section> : null}
        {step === 'condicoes' ? <section><SectionTitle title="Condições da pré-venda" subtitle="A filial vem da sessão autenticada." /><InfoGrid><Info label="Cliente" value={`${form.cliente?.codigo} · ${form.cliente?.nome}`} /><Info label="Filial" value={`${usuario.filial.codigo} · ${usuario.filial.nome}`} /></InfoGrid><label className={styles.label} htmlFor="vendedor">Vendedor</label>{vendedoresQuery.isLoading ? <Loading /> : vendedoresQuery.isError ? <ErrorMessage message={errorText(vendedoresQuery.error)} /> : <select id="vendedor" className={styles.input} value={form.vendedor?.codigo ?? ''} onChange={(event) => setForm((current) => ({ ...current, vendedor: vendedores.find((vendedor) => vendedor.codigo === Number(event.target.value)) ?? null, vendedorCodigo: Number(event.target.value) || 0 }))}><option value="">Selecione</option>{vendedores.map((vendedor) => <option key={vendedor.codigo} value={vendedor.codigo}>{vendedor.codigo} · {vendedor.nomeCompleto ?? vendedor.descricao}</option>)}</select>}<label className={styles.label} htmlFor="forma">Forma de pagamento</label>{formasQuery.isLoading ? <Loading /> : formasQuery.isError ? <ErrorMessage message={errorText(formasQuery.error)} /> : <select id="forma" className={styles.input} value={form.formaPagamento?.codigo ?? ''} onChange={(event) => selectFormaPagamento(Number(event.target.value))}><option value="">Selecione</option>{formas.map((forma) => <option key={forma.codigo} value={forma.codigo}>{forma.descricao}</option>)}</select>}{possuiRestricaoVendaPrazo ? <p className={styles.integrationNotice} role="status">{RESTRICAO_VENDA_PRAZO_MESSAGE}</p> : null}{form.formaPagamento?.exigeParcela ? <><label className={styles.label} htmlFor="parcela">Parcela</label>{parcelasQuery.isLoading ? <Loading /> : parcelasQuery.isError ? <ErrorMessage message={errorText(parcelasQuery.error)} /> : <select id="parcela" className={styles.input} value={form.parcelaCodigo ?? ''} onChange={(event) => setForm((current) => ({ ...current, parcelaCodigo: Number(event.target.value) || null }))} required><option value="">Selecione</option>{parcelas.map((parcela) => <option key={parcela.codigo} value={parcela.codigo}>{parcela.descricao}</option>)}</select>}</> : form.formaPagamento ? <p className={styles.helperMessage}>Esta forma não exige parcela. Será enviado <code>parcelaCodigo=0</code>.</p> : null}<label className={styles.label} htmlFor="observacao">Observação <small>(opcional)</small></label><textarea id="observacao" className={styles.input} rows={3} value={form.observacao} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} placeholder="Digite uma observação" /><div className={styles.editorRow}><label className={styles.label} htmlFor="dataPreVenda">Data<input className={styles.input} id="dataPreVenda" type="date" value={dataPreVenda} onChange={(event) => setDataPreVenda(event.target.value)} required /></label><label className={styles.label} htmlFor="horaPreVenda">Hora<input className={styles.input} id="horaPreVenda" type="time" value={horaPreVenda} onChange={(event) => setHoraPreVenda(event.target.value)} required /></label></div></section> : null}
        {step === 'produtos' ? <section>
          <SectionTitle title="Adicione os produtos" subtitle="Pesquise manualmente ou leia o código com a câmera." />
          <div className={styles.scanSearch}><SearchInput value={produtoBusca} onChange={(value) => { setProdutoBusca(value); setProdutoSelecionado(null); setPrecoSelecionado(null); }} placeholder="Código, código de barras ou descrição" /><button className={styles.secondaryButton} type="button" aria-label="Ler código do produto" onClick={() => void scanProduto()} disabled={resolverMutation.isPending}><Camera size={19} /> {resolverMutation.isPending ? 'Buscando…' : 'Câmera'}</button></div>
          {resolverMutation.isError ? <ErrorMessage message={errorText(resolverMutation.error)} /> : null}
          {produtoQuery.isLoading ? <Loading /> : produtoQuery.isError ? <ErrorMessage message={errorText(produtoQuery.error)} /> : <Results>{produtoResultados.map((produto) => <button type="button" key={`${produto.codigo}-${produto.filial}`} className={`${styles.result} ${produtoSelecionado?.codigo === produto.codigo ? styles.selected : ''}`} onClick={() => selectProduto(produto)}><span><strong>{produto.descricao}</strong><small>Código {produto.codigo} · Estoque {produto.estoqueAtual} {produto.unidade ?? ''}</small><small>{[produto.precoVenda, produto.precoVenda1, produto.precoVenda2, produto.precoVenda3].map((preco, i) => `Preço ${i + 1}: ${preco === null ? '—' : currency.format(preco)}`).join(' · ')}</small></span>{produtoSelecionado?.codigo === produto.codigo ? <Check size={20} /> : null}</button>)}</Results>}
          {produtoSelecionado ? <div className={styles.itemEditor}><strong>{produtoSelecionado.descricao}</strong><div className={styles.priceChoices}>{produtoPrecos.map((preco, index) => <label key={index} className={styles.priceChoice}><input type="radio" name="preco" value={index} checked={precoSelecionado === index} disabled={preco === null || preco <= 0} onChange={() => { setPrecoSelecionado(index); setMensagem(''); }} /><span>Preço {index + 1}<strong>{preco === null ? '—' : currency.format(preco)}</strong></span></label>)}</div><label className={styles.label} htmlFor="quantidade">Quantidade</label><div className={styles.quantityControl}><button type="button" aria-label="Diminuir quantidade" onClick={() => changeQuantidade(-1)} disabled={quantidade <= 1}><Minus size={16} /></button><input id="quantidade" className={styles.input} type="number" min="1" step="any" value={quantidade} onChange={(event) => { const nextQuantidade = Number(event.target.value); if (Number.isFinite(nextQuantidade) && nextQuantidade >= 1) setQuantidade(nextQuantidade); }} /><button type="button" aria-label="Aumentar quantidade" onClick={() => changeQuantidade(1)}><Plus size={16} /></button></div><label className={styles.label} htmlFor="descontoItem">Desconto (%)<input id="descontoItem" className={styles.input} type="number" min="0" max="100" step="0.01" value={percentualDesconto} onChange={(event) => setItemDiscount(Number(event.target.value))} /></label><p className={styles.itemTotal}>Total: {valorUnitario === null || !quantidadeValida ? '—' : currency.format(calcularItem({ quantidade, valorUnitario, percentualDesconto }).total)}</p><button type="button" className={styles.primaryButton} onClick={addItem} disabled={valorUnitario === null || valorUnitario <= 0}><Plus size={18} /> Adicionar item</button></div> : null}
        </section> : null}
        {step === 'carrinho' ? <section><SectionTitle title="Itens da pré-venda" subtitle="Revise quantidades e remova itens antes da revisão." />{form.itens.map((item) => <article className={styles.cartItem} key={`${item.codigo}-${item.precoSelecionado}`}><div><strong>{item.descricao}</strong><small>{item.codigo} · Preço {item.precoSelecionado} · {item.quantidade} × {currency.format(item.valorUnitario)} · desconto {item.percentualDesconto}%</small></div><div className={styles.cartActions}><button type="button" aria-label={`Diminuir quantidade de ${item.descricao}`} onClick={() => updateQuantity(item, -1)}><Minus size={16} /></button><b>{item.quantidade}</b><button type="button" aria-label={`Aumentar quantidade de ${item.descricao}`} onClick={() => updateQuantity(item, 1)}><Plus size={16} /></button><button type="button" aria-label={`Remover ${item.descricao}`} className={styles.deleteButton} onClick={() => removeItem(item)}><Trash2 size={17} /></button></div><strong className={styles.lineTotal}>{currency.format(calcularItem(item).total)}</strong></article>)}<Totals totals={totais} /></section> : null}
        {step === 'revisao' ? <section><SectionTitle title="Revise antes de enviar" subtitle="Confira os dados antes de registrar a pré-venda." /><ReviewRow label="Cliente" value={`${form.cliente?.codigo} · ${form.cliente?.nome}`} /><ReviewRow label="Vendedor" value={selectedSeller ? `${selectedSeller.codigo} · ${selectedSeller.nomeCompleto ?? selectedSeller.descricao}` : 'Não selecionado'} /><ReviewRow label="Filial" value={`${usuario.filial.codigo} · ${usuario.filial.nome}`} /><ReviewRow label="Pagamento" value={`${form.formaPagamento?.descricao ?? 'Não selecionado'}${form.formaPagamento?.exigeParcela ? ` · ${parcelas.find((item) => item.codigo === form.parcelaCodigo)?.descricao ?? 'Parcela não selecionada'}` : ' · sem parcela'}`} /><ReviewRow label="Data" value={dataPreVenda} /><ReviewRow label="Hora" value={horaPreVenda} /><ReviewRow label="Observação" value={form.observacao || 'Não informada'} /><Totals totals={totais} /><div className={styles.integrationNotice}>A pré-venda será enviada à API usando a sessão autenticada.</div></section> : null}
        {mensagem ? <p className={numeroCriado !== null ? styles.successMessage : styles.errorMessage} role={numeroCriado !== null ? 'status' : 'alert'}>{mensagem}</p> : null}
        <div className={styles.footerActions}>{step !== 'cliente' ? <button type="button" className={styles.secondaryButton} onClick={back} disabled={enviando}><ChevronLeft size={18} /> Voltar</button> : <button type="button" className={styles.secondaryButton} onClick={() => navigate('/vendas')} disabled={enviando}><ArrowLeft size={18} /> Cancelar</button>}{step === 'revisao' ? <button type="button" className={styles.primaryButton} onClick={sendPreVenda} disabled={enviando}>{enviando ? <><LoaderCircle size={18} className={styles.spinner} /> Enviando...</> : <><Send size={18} /> Enviar pré-venda</>}</button> : <button type="button" className={styles.primaryButton} onClick={next} disabled={clienteBloqueado}>Continuar <ArrowRight size={18} /></button>}</div>
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
