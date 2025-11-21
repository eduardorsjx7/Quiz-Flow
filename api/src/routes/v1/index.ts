import express from 'express';
import authRoutes from './auth.routes';
import jornadaRoutes from './jornada.routes';
import faseRoutes from './fase.routes';
import quizRoutes from './quiz.routes';
import tentativaRoutes from './tentativa.routes';
import respostaRoutes from './resposta.routes';
import relatorioRoutes from './relatorio.routes';
import grupoRoutes from './grupo.routes';
import atribuicaoRoutes from './atribuicao.routes';

/**
 * Router Factory para API v1
 * Implementa o padrão Factory Pattern para criação de rotas
 */
const router = express.Router();

// Registrar todas as rotas da v1
router.use('/auth', authRoutes);
router.use('/jornadas', jornadaRoutes);
router.use('/fases', faseRoutes);
router.use('/quizzes', quizRoutes);
router.use('/tentativas', tentativaRoutes);
router.use('/respostas', respostaRoutes);
router.use('/relatorios', relatorioRoutes);
router.use('/grupos', grupoRoutes);
router.use('/atribuicoes', atribuicaoRoutes);

export default router;

