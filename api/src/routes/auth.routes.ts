import express from 'express';
import { login, criarAdmin, getMe, listarUsuarios, criarUsuario, atualizarUsuario, alterarSenha, deletarUsuario } from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.post('/criar-admin', criarAdmin);
router.get('/me', authenticate, getMe);
router.get('/usuarios', authenticate, requireAdmin, listarUsuarios);
router.post('/criar-usuario', authenticate, requireAdmin, criarUsuario);
router.put('/usuarios/:id', authenticate, atualizarUsuario);
router.put('/usuarios/:id/senha', authenticate, alterarSenha);
router.delete('/usuarios/:id', authenticate, requireAdmin, deletarUsuario);

export default router;

