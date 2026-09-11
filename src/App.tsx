import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ClientesPage } from './pages/ClientesPage';
import { ContaReceberDetalhePage } from './pages/ContaReceberDetalhePage';
import { ContasReceberPage } from './pages/ContasReceberPage';
import { EstoquesPage } from './pages/EstoquesPage';
import { VendasPage } from './pages/VendasPage';
import { HomeScreen } from './screens/HomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { PreVendaScreen } from './screens/PreVendaScreen';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendas"
        element={
          <ProtectedRoute>
            <VendasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendas/nova-pre-venda"
        element={
          <ProtectedRoute>
            <PreVendaScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <ClientesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/estoques"
        element={
          <ProtectedRoute>
            <EstoquesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contas-receber"
        element={
          <ProtectedRoute>
            <ContasReceberPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contas-receber/:numeroPedido/:parcela"
        element={
          <ProtectedRoute>
            <ContaReceberDetalhePage />
          </ProtectedRoute>
        }
      />
      <Route path="/estoque" element={<Navigate to="/estoques" replace />} />
      <Route path="/contas-a-receber" element={<Navigate to="/contas-receber" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
