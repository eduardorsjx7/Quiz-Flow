import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from './config/env';
import logger from './config/logger';
import { requestLogger, errorLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Importar rotas
import authRoutes from './routes/auth.routes';
import quizRoutes from './routes/quiz.routes';
import sessaoRoutes from './routes/sessao.routes';
import respostaRoutes from './routes/resposta.routes';
import relatorioRoutes from './routes/relatorio.routes';

const app = express();

// Middlewares globais
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo de 100 requisições por IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
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

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/sessoes', sessaoRoutes);
app.use('/api/respostas', respostaRoutes);
app.use('/api/relatorios', relatorioRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (deve ser o último)
app.use(errorLogger);
app.use(errorHandler);

export default app;

