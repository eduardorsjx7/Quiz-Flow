import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: string;
  matricula?: string;
  nomeExibicao?: string;
  fotoPerfil?: string;
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
  const verificandoRef = useRef(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !verificandoRef.current) {
      setToken(storedToken);
      // O interceptor do api.ts já adiciona o token automaticamente
      verificarToken(storedToken);
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listener para atualizar usuário quando houver mudanças
  useEffect(() => {
    const handleUserUpdate = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken && !verificandoRef.current) {
        await verificarToken(storedToken);
      }
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verificarToken = async (tokenToVerify: string) => {
    if (verificandoRef.current) return;
    
    try {
      verificandoRef.current = true;
      setIsLoading(true);
      
      const response = await api.get('/auth/me');
      // A resposta vem como { success: true, data: usuario }
      const usuario = response.data.data || response.data;
      setUsuario(usuario);
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Não limpar token em caso de 429, apenas aguardar e não tentar novamente
        console.warn('Muitas requisições. Aguardando...');
        // Aguardar antes de permitir nova tentativa
        await new Promise(resolve => setTimeout(resolve, 5000));
        return;
      }
      localStorage.removeItem('token');
      setToken(null);
      setUsuario(null);
    } finally {
      setIsLoading(false);
      verificandoRef.current = false;
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
      // Tratar erro 429 (Too Many Requests)
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 15;
        const customError: any = new Error(`Muitas tentativas de login. Aguarde ${retryAfter} segundos e tente novamente.`);
        customError.response = error.response;
        customError.isNetworkError = false;
        customError.retryAfter = retryAfter;
        throw customError;
      }
      // A API retorna erros no formato: { success: false, error: { message: "..." } }
      let errorMessage = 'Erro ao fazer login';
      
      if (error.response) {
        // Erro com resposta da API
        const errorData = error.response.data;
        if (errorData?.error) {
          // Pode ser objeto { message: "..." } ou string
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } else if (error.request) {
        // Erro de rede (sem resposta do servidor)
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Criar um erro com informações adicionais
      const customError: any = new Error(errorMessage);
      customError.response = error.response;
      customError.isNetworkError = !error.response;
      throw customError;
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

