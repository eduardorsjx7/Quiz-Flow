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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // O interceptor do api.ts já adiciona o token automaticamente
      verificarToken(storedToken);
    }
  }, []);

  const verificarToken = async (tokenToVerify: string) => {
    try {
      const response = await api.get('/auth/me');
      // A resposta vem como { success: true, data: usuario }
      const usuario = response.data.data || response.data;
      setUsuario(usuario);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUsuario(null);
    }
  };

  const login = async (email: string, senha: string) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        senha
      });

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
        isAdmin: usuario?.tipo === 'ADMINISTRADOR'
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

