import { Router } from 'express';
import { avaliacaoController } from '../controllers/avaliacao.controller';

const router = Router();

// Rotas de avaliação
router.post('/', avaliacaoController.criar.bind(avaliacaoController));
router.get('/jornada/:jornadaId', avaliacaoController.listar.bind(avaliacaoController));
router.get('/jornada/:jornadaId/ativa', avaliacaoController.buscarAvaliacaoAtiva.bind(avaliacaoController));
router.get('/:id', avaliacaoController.buscar.bind(avaliacaoController));
router.put('/:id', avaliacaoController.atualizar.bind(avaliacaoController));
router.delete('/:id', avaliacaoController.deletar.bind(avaliacaoController));

// Rotas de resposta
router.post('/responder', avaliacaoController.responder.bind(avaliacaoController));
router.get('/:avaliacaoId/verificar/:usuarioId', avaliacaoController.verificarResposta.bind(avaliacaoController));
router.get('/:id/respostas', avaliacaoController.buscarRespostas.bind(avaliacaoController));
router.get('/:id/relatorio', avaliacaoController.gerarRelatorio.bind(avaliacaoController));

// Rotas de gerenciamento de perguntas
router.post('/jornada/:jornadaId/perguntas', avaliacaoController.adicionarPerguntaEmTodasAvaliacoes.bind(avaliacaoController));
router.delete('/jornada/:jornadaId/perguntas/:indicePergunta', avaliacaoController.excluirPerguntaPorIndice.bind(avaliacaoController));
router.put('/jornada/:jornadaId/perguntas/mover', avaliacaoController.moverPergunta.bind(avaliacaoController));

export default router;

