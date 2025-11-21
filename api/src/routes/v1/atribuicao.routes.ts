import { Router } from 'express';
import * as atribuicaoController from '../../controllers/atribuicao.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

router.post('/quiz/:quizId', authenticate, requireAdmin, atribuicaoController.atribuirQuiz);
router.delete('/:id', authenticate, requireAdmin, atribuicaoController.removerAtribuicao);
router.get('/quiz/:quizId', authenticate, requireAdmin, atribuicaoController.listarAtribuicoesPorQuiz);

export default router;

