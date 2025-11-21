import { Router } from 'express';
import * as jornadaController from '../../controllers/jornada.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, jornadaController.listarJornadas);
router.get('/:id', authenticate, jornadaController.buscarJornadaPorId);
router.post('/', authenticate, requireAdmin, jornadaController.criarJornada);
router.put('/:id', authenticate, requireAdmin, jornadaController.atualizarJornada);
router.delete('/:id', authenticate, requireAdmin, jornadaController.deletarJornada);

export default router;

