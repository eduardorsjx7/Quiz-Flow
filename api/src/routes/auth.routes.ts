import express from 'express';
import { login, criarAdmin, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.post('/criar-admin', criarAdmin);
router.get('/me', authenticate, getMe);

export default router;

