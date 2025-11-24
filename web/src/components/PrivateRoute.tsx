import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from './LoadingScreen';

interface PrivateRouteProps {
  children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading durante a verificação inicial do token
  if (isLoading) {
    return <LoadingScreen message="Verificando autenticação..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Não redirecionar automaticamente - deixar a rota decidir
  // As rotas específicas de admin já têm verificação de admin
  return children;
};

export default PrivateRoute;

