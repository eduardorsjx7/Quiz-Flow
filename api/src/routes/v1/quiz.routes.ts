import express from 'express';
import { QuizController } from '../../controllers/v1/QuizController';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { container } from '../../container/ServiceContainer';

const router = express.Router();

// Função helper para resolver o controller (lazy loading)
const getQuizController = (): QuizController => {
  return container.resolve<QuizController>('QuizController');
};

router.get('/', authenticate, (req, res, next) => getQuizController().listarQuizzes(req, res, next));
router.get('/disponiveis', authenticate, (req, res, next) => getQuizController().listarQuizzesDisponiveis(req, res, next));
router.get('/fase/:faseId', authenticate, (req, res, next) => getQuizController().buscarQuizPorFase(req, res, next));
router.get('/:id', authenticate, (req, res, next) => getQuizController().buscarQuiz(req, res, next));
router.post('/', authenticate, requireAdmin, (req, res, next) => getQuizController().criarQuiz(req, res, next));
router.put('/:id', authenticate, requireAdmin, (req, res, next) => getQuizController().atualizarQuiz(req, res, next));
router.delete('/:id', authenticate, requireAdmin, (req, res, next) => getQuizController().deletarQuiz(req, res, next));
router.post('/:id/perguntas', authenticate, requireAdmin, (req, res, next) => getQuizController().adicionarPergunta(req, res, next));

export default router;

