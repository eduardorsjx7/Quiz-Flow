import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 30000, // 30 segundos de timeout
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log detalhado da requisição (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Request]', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        hasToken: !!token,
        timestamp: new Date().toISOString(),
      });
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    // Log detalhado da resposta (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Response]', {
        status: response.status,
        url: response.config.url,
        method: response.config.method?.toUpperCase(),
        timestamp: new Date().toISOString(),
      });
    }
    return response;
  },
  (error) => {
    // Log detalhado do erro
    const errorDetails = {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      hasResponse: !!error.response,
      hasRequest: !!error.request,
      timestamp: new Date().toISOString(),
    };

    console.error('[API Error]', errorDetails);

    // Tratar erros específicos
    if (!error.response) {
      // Erro de rede (sem resposta do servidor)
      if (error.code === 'ECONNABORTED') {
        error.message = 'Timeout na requisição. O servidor demorou muito para responder.';
        error.isNetworkError = true;
        error.isTimeout = true;
      } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        error.message = 'Erro de conexão. Verifique se o servidor está rodando e sua conexão com a internet.';
        error.isNetworkError = true;
        error.isConnectionError = true;
      } else {
        error.message = 'Erro de conexão. Verifique sua internet e tente novamente.';
        error.isNetworkError = true;
      }
    } else if (error.response.status === 401) {
      // Token inválido ou expirado
      if (error.config?.url?.includes('/auth/login')) {
        // Não limpar token em caso de erro no login
      } else {
        // Limpar token se não for uma requisição de login
        localStorage.removeItem('token');
      }
    }

    return Promise.reject(error);
  }
);

export default api;

