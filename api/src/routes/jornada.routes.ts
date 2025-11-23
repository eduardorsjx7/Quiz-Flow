import { Router } from 'express';
import * as jornadaController from '../controllers/jornada.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, jornadaController.listarJornadas);
router.get('/:id/estatisticas', authenticate, requireAdmin, jornadaController.obterEstatisticasCompletas);
router.get('/:id/configuracao', authenticate, requireAdmin, jornadaController.buscarConfiguracao);
router.get('/:id/fases', authenticate, jornadaController.buscarFasesPorJornada);
router.get('/:id', authenticate, jornadaController.buscarJornadaPorId);
router.post('/', authenticate, requireAdmin, jornadaController.upload.single('imagemCapa'), jornadaController.criarJornada);
router.put('/:id/configuracao', authenticate, requireAdmin, jornadaController.salvarConfiguracao);
router.put('/:id', authenticate, requireAdmin, jornadaController.upload.single('imagemCapa'), jornadaController.atualizarJornada);
router.delete('/:id', authenticate, requireAdmin, jornadaController.deletarJornada);

export default router;

