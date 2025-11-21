import { Router } from 'express';
import * as grupoController from '../../controllers/grupo.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, grupoController.listarGrupos);
router.get('/:id', authenticate, grupoController.buscarGrupoPorId);
router.post('/', authenticate, requireAdmin, grupoController.criarGrupo);
router.put('/:id', authenticate, requireAdmin, grupoController.atualizarGrupo);
router.delete('/:id', authenticate, requireAdmin, grupoController.deletarGrupo);

export default router;

