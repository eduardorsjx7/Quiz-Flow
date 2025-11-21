import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // O interceptor do api.ts já adiciona o token automaticamente
      verificarToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verificarToken = async (tokenToVerify: string) => {
    try {
      setIsLoading(true);
      // Delay mínimo de 2.5 segundos para melhorar a experiência
      const [response] = await Promise.all([
        api.get('/auth/me'),
        new Promise<void>((resolve) => setTimeout(() => resolve(), 2500))
      ]);
      // A resposta vem como { success: true, data: usuario }
      const usuario = response.data.data || response.data;
      setUsuario(usuario);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUsuario(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, senha: string) => {
    try {
      // Delay mínimo de 2.5 segundos para melhorar a experiência de login
      const [response] = await Promise.all([
        api.post('/auth/login', {
          email,
          senha
        }),
        new Promise<void>((resolve) => setTimeout(() => resolve(), 2500))
      ]);

      // A resposta vem como { success: true, data: { token, usuario } }
      const { token: newToken, usuario: newUsuario } = response.data.data || response.data;
      
      if (!newToken) {
        throw new Error('Token não recebido do servidor');
      }

      setToken(newToken);
      setUsuario(newUsuario);
      localStorage.setItem('token', newToken);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || 'Erro ao fazer login');
    }
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('token');
    // O interceptor do api.ts gerencia o token automaticamente
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!usuario,
        isAdmin: usuario?.tipo === 'ADMINISTRADOR',
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

