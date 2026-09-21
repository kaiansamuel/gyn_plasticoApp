import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { Phone } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { type ClientesResponse, type TelefoneCliente } from '../api/consultas';
import { useAuth } from '../auth/auth-context';
import { Card } from '../components/Card';
import { EmptyState } from '../components/QueryState';
import { ScreenHeader } from '../components/ScreenHeader';
import styles from './ClienteDetalhePage.module.css';

export function ClienteDetalhePage() {
  const { codigo } = useParams<{ codigo: string }>();
  const { token, usuario } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const cliente = queryClient.getQueriesData<InfiniteData<ClientesResponse>>({ queryKey: ['clientes', token] })
    .flatMap(([, data]) => data?.pages.flatMap((page) => page.data) ?? [])
    .find((item) => String(item.clienteCodigo) === codigo);

  return <div className={styles.page}>
    <ScreenHeader title="Detalhes do Cliente" subtitle={usuario?.filial.nome} onBack={() => navigate(`/clientes${location.search}`)} />
    {cliente ? <main className={styles.content}>
      <section aria-labelledby="dados-cliente">
        <h2 className={styles.sectionTitle} id="dados-cliente">Dados do cliente</h2>
        <Card><dl className={styles.details}>
          <Detail label="Código do cliente" value={String(cliente.clienteCodigo)} />
          <Detail label="Nome" value={cliente.nome} />
          <Detail label="Razão social" value={cliente.razaoSocial} />
          <Detail label="CPF/CNPJ" value={cliente.cnpjCpf} />
        </dl></Card>
      </section>
      <section aria-labelledby="localizacao">
        <h2 className={styles.sectionTitle} id="localizacao">Localização</h2>
        <Card><dl className={styles.details}>
          <Detail label="Endereço" value={cliente.endereco} />
          <Detail label="Bairro" value={cliente.bairro} />
          <Detail label="Cidade" value={cliente.cidade} />
        </dl></Card>
      </section>
      <section aria-labelledby="telefones">
        <h2 className={styles.sectionTitle} id="telefones">Telefones</h2>
        <Card>
          {cliente.telefones?.length ? <ul className={styles.phoneList}>
            {cliente.telefones.map((telefone) => <PhoneItem key={telefone.sequencia} telefone={telefone} />)}
          </ul> : <p className={styles.emptyPhones}>Nenhum telefone cadastrado.</p>}
        </Card>
      </section>
    </main> : <EmptyState message="Dados do cliente indisponíveis nesta sessão. Volte para Clientes e abra o cliente pela listagem." />}
  </div>;
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return <div className={styles.detailRow}><dt>{label}</dt><dd>{value?.trim() || 'Não informado'}</dd></div>;
}

function PhoneItem({ telefone }: { telefone: TelefoneCliente }) {
  const uri = createPhoneUri(telefone);

  return <li className={styles.phoneItem}>
    <div className={styles.phoneContent}>
      <span className={styles.phoneNumber}>{formatPhone(telefone)}</span>
      {telefone.contato?.trim() ? <span className={styles.phoneContact}>{telefone.contato}</span> : null}
    </div>
    {uri ? <a className={styles.callAction} href={uri} aria-label={`Ligar para ${formatPhone(telefone)}`}>
      <Phone size={18} aria-hidden="true" />
      <span>Ligar</span>
    </a> : null}
  </li>;
}

function formatPhone({ ddd, numero }: TelefoneCliente): string {
  const cleanDdd = ddd?.trim() ?? '';
  const cleanNumber = numero?.trim() ?? '';

  if (/^\d{2}$/.test(cleanDdd) && /^\d{9}$/.test(cleanNumber)) {
    return `(${cleanDdd}) ${cleanNumber.slice(0, 5)}-${cleanNumber.slice(5)}`;
  }

  if (/^\d{2}$/.test(cleanDdd) && /^\d{8}$/.test(cleanNumber)) {
    return `(${cleanDdd}) ${cleanNumber.slice(0, 4)}-${cleanNumber.slice(4)}`;
  }

  return [ddd, numero].filter((value): value is string => Boolean(value)).join(' ') || 'Não informado';
}

function createPhoneUri({ ddd, numero }: TelefoneCliente): string | null {
  const digits = `${ddd ?? ''}${numero ?? ''}`.replace(/\D/g, '');
  return digits ? `tel:${digits}` : null;
}
