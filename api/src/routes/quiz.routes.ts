import express from 'express';
import {
  listarQuizzes,
  listarQuizzesDisponiveis,
  buscarQuiz,
  buscarQuizPorFase,
  criarQuiz,
  atualizarQuiz,
  deletarQuiz,
  adicionarPergunta,
} from '../controllers/quiz.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, listarQuizzes);
router.get('/disponiveis', authenticate, listarQuizzesDisponiveis);
router.get('/fase/:faseId', authenticate, buscarQuizPorFase);
router.get('/:id', authenticate, buscarQuiz);
router.post('/', authenticate, requireAdmin, criarQuiz);
router.put('/:id', authenticate, requireAdmin, atualizarQuiz);
router.delete('/:id', authenticate, requireAdmin, deletarQuiz);
router.post('/:id/perguntas', authenticate, requireAdmin, adicionarPergunta);

export default router;

