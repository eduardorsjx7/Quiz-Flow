import { Router } from 'express';
import { FaseController } from '../controllers/fase.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const faseController = new FaseController();

// Rotas públicas (requerem autenticação)
router.get('/', authenticate, faseController.listarFases);
router.get('/atual', authenticate, faseController.obterFaseAtual);
router.get('/:id', authenticate, faseController.buscarPorId);

// Rotas administrativas
router.post('/', authenticate, requireAdmin, faseController.criarFase);
router.put('/:id', authenticate, requireAdmin, faseController.atualizarFase);
router.delete('/:id', authenticate, requireAdmin, faseController.deletarFase);

// Rotas de desbloqueio
router.post(
  '/:faseId/desbloquear/usuario/:usuarioId',
  authenticate,
  requireAdmin,
  faseController.desbloquearFaseParaUsuario
);
router.post(
  '/:faseId/desbloquear/todos',
  authenticate,
  requireAdmin,
  faseController.desbloquearFaseParaTodos
);
router.delete(
  '/:faseId/bloquear/usuario/:usuarioId',
  authenticate,
  requireAdmin,
  faseController.bloquearFaseParaUsuario
);
router.get(
  '/:faseId/usuarios-desbloqueados',
  authenticate,
  requireAdmin,
  faseController.listarUsuariosComDesbloqueio
);

export default router;

