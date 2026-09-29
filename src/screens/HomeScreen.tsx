import { Boxes, ReceiptText, ShoppingCart, Users, ClipboardPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { ModuleCard } from '../components/ModuleCard';
import { ScreenHeader } from '../components/ScreenHeader';
import styles from './HomeScreen.module.css';

const modules = [
  { path: '/vendas', title: 'Vendas', description: 'Pedidos e valores vendidos', icon: ShoppingCart },
  { path: '/clientes', title: 'Clientes', description: 'Cadastro e contatos', icon: Users },
  { path: '/estoques', title: 'Estoque', description: 'Produtos e disponibilidade', icon: Boxes },
  { path: '/contas-receber', title: 'Contas a receber', description: 'Parcelas e vencimentos', icon: ReceiptText },
  { path: '/vendas/nova-pre-venda', title: 'Pré-venda', description: 'Registrar uma nova pré-venda', icon: ClipboardPlus },
];

export function HomeScreen() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  if (!usuario) {
    return null;
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.page}>
      <ScreenHeader
        title="Gyn Plástico"
        subtitle={`${usuario.nome} · ${usuario.filial.nome}`}
        onLogout={handleLogout}
      />
      <div className={styles.content}>
        <p className={styles.sectionTitle}>Consultas</p>
        <p className={styles.sectionSubtitle}>Acesse as informações do seu negócio.</p>
        <div className={styles.grid}>
          {modules.map((module) => (
            <ModuleCard
              key={module.path}
              icon={module.icon}
              title={module.title}
              description={module.description}
              onClick={() => navigate(module.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
