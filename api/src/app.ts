import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from './config/env';
import logger from './config/logger';
import { requestLogger, errorLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { registerServices } from './container/registerServices';

// Registrar serviços no container ANTES de importar rotas
// Isso garante que os serviços estejam disponíveis quando as rotas forem carregadas
registerServices();

// Importar rotas legadas (mantidas para compatibilidade)
import authRoutes from './routes/auth.routes';
import jornadaRoutes from './routes/jornada.routes';
import faseRoutes from './routes/fase.routes';
import quizRoutes from './routes/quiz.routes';
import tentativaRoutes from './routes/tentativa.routes';
import respostaRoutes from './routes/resposta.routes';
import relatorioRoutes from './routes/relatorio.routes';
import grupoRoutes from './routes/grupo.routes';
import atribuicaoRoutes from './routes/atribuicao.routes';
import avaliacaoRoutes from './routes/avaliacao.routes';

// Importar rotas v1 (nova estrutura com Design Patterns)
import v1Routes from './routes/v1';

const app = express();

// Middlewares globais
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (imagens)
app.use('/uploads', express.static('uploads'));

// Rate limiting - mais permissivo em desenvolvimento
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: config.NODE_ENV === 'development' ? 1000 : 100, // 1000 em dev, 100 em produção
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Em desenvolvimento, pular rate limiting para requisições de health check
    return config.NODE_ENV === 'development' && req.path === '/health';
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      success: false,
      error: {
        message: 'Muitas requisições. Aguarde alguns instantes e tente novamente.',
      },
    });
  },
});

app.use('/api/', limiter);

// Logging middleware
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
  });
});

// Rotas da API v1 (nova estrutura com Design Patterns)
app.use('/api/v1', v1Routes);

// Rotas legadas (mantidas para compatibilidade - serão descontinuadas)
app.use('/api/auth', authRoutes);
app.use('/api/jornadas', jornadaRoutes);
app.use('/api/fases', faseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/tentativas', tentativaRoutes);
app.use('/api/respostas', respostaRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/grupos', grupoRoutes);
app.use('/api/atribuicoes', atribuicaoRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (deve ser o último)
app.use(errorLogger);
app.use(errorHandler);

export default app;

