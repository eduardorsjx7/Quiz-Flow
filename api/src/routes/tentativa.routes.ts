import { Router } from 'express';
import * as tentativaController from '../controllers/tentativa.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/quiz/:quizId/iniciar', authenticate, tentativaController.iniciarTentativa);
router.get('/:id', authenticate, tentativaController.buscarTentativaPorId);
router.post('/:id/finalizar', authenticate, tentativaController.finalizarTentativa);
router.get('/quiz/:quizId/ranking', authenticate, tentativaController.obterRankingQuiz);
router.get('/usuario/minhas', authenticate, tentativaController.listarTentativasDoUsuario);

export default router;

