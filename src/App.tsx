import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { HomeScreen } from './screens/HomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ModulePlaceholderScreen } from './screens/ModulePlaceholderScreen';
import { PreVendaScreen } from './screens/PreVendaScreen';
import { SalesScreen } from './screens/SalesScreen';

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
            <SalesScreen />
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
            <ModulePlaceholderScreen title="Clientes" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/estoque"
        element={
          <ProtectedRoute>
            <ModulePlaceholderScreen title="Estoque" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contas-a-receber"
        element={
          <ProtectedRoute>
            <ModulePlaceholderScreen title="Contas a receber" />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
