import { Router } from 'express';
import { FaseController } from '../controllers/v1/FaseController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { container } from '../container/ServiceContainer';

const router = Router();

// Função helper para resolver o controller (lazy loading)
const getFaseController = (): FaseController => {
  return container.resolve<FaseController>('FaseController');
};

// Rotas públicas (requerem autenticação) - redirecionadas para novos controllers
router.get('/', authenticate, (req, res, next) => getFaseController().listarFases(req, res, next));
router.get('/atual', authenticate, (req, res, next) => getFaseController().obterFaseAtual(req, res, next));
router.get('/:id', authenticate, (req, res, next) => getFaseController().buscarPorId(req, res, next));

// Rotas administrativas
router.post('/', authenticate, requireAdmin, (req, res, next) => getFaseController().criarFase(req, res, next));
router.put('/:id', authenticate, requireAdmin, (req, res, next) => getFaseController().atualizarFase(req, res, next));
router.delete('/:id', authenticate, requireAdmin, (req, res, next) => getFaseController().deletarFase(req, res, next));

// Rotas de desbloqueio (ajustadas para corresponder aos novos controllers)
router.post(
  '/:faseId/desbloquear/usuario/:usuarioId',
  authenticate,
  requireAdmin,
  (req, res, next) => getFaseController().desbloquearFaseParaUsuario(req, res, next)
);
router.post(
  '/:faseId/desbloquear/todos',
  authenticate,
  requireAdmin,
  (req, res, next) => getFaseController().desbloquearFaseParaTodos(req, res, next)
);
router.delete(
  '/:faseId/bloquear/usuario/:usuarioId',
  authenticate,
  requireAdmin,
  (req, res, next) => getFaseController().bloquearFaseParaUsuario(req, res, next)
);
router.get(
  '/:faseId/usuarios-desbloqueados',
  authenticate,
  requireAdmin,
  (req, res, next) => getFaseController().listarUsuariosComDesbloqueio(req, res, next)
);

export default router;

