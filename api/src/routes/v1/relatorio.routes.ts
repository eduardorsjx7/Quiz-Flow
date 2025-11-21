import express from 'express';
import {
  relatorioPorQuiz,
  relatorioPorColaborador,
  relatorioPorPergunta,
  exportarCSV,
  exportarPDF,
} from '../../controllers/relatorio.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = express.Router();

router.get('/quiz/:quizId', authenticate, requireAdmin, relatorioPorQuiz);
router.get('/colaborador/:usuarioId', authenticate, requireAdmin, relatorioPorColaborador);
router.get('/pergunta/:perguntaId', authenticate, requireAdmin, relatorioPorPergunta);
router.get('/quiz/:quizId/export/csv', authenticate, requireAdmin, exportarCSV);
router.get('/quiz/:quizId/export/pdf', authenticate, requireAdmin, exportarPDF);

export default router;

