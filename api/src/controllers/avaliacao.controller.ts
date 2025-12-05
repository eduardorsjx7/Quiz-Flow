import { Request, Response } from 'express';
import { avaliacaoService } from '../services/avaliacao.service';
import logger from '../config/logger';

export class AvaliacaoController {
  /**
   * Criar nova avaliação de jornada
   */
  async criar(req: Request, res: Response) {
    try {
      const dados = req.body;
      const avaliacao = await avaliacaoService.criarAvaliacao(dados);
      
      return res.status(201).json({
        success: true,
        data: avaliacao,
        message: 'Avaliação criada com sucesso',
      });
    } catch (error: any) {
      logger.error('Erro ao criar avaliação', { error });
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao criar avaliação',
      });
    }
  }

  /**
   * Listar avaliações de uma jornada
   */
  async listar(req: Request, res: Response) {
    try {
      const { jornadaId } = req.params;
      const avaliacoes = await avaliacaoService.listarAvaliacoes(Number(jornadaId));
      
      return res.status(200).json({
        success: true,
        data: avaliacoes,
      });
    } catch (error: any) {
      logger.error('Erro ao listar avaliações', { error });
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao listar avaliações',
      });
    }
  }

  /**
   * Buscar avaliação por ID
   */
  async buscar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const incluirRespostas = req.query.incluirRespostas === 'true';
      
      const avaliacao = await avaliacaoService.buscarAvaliacao(
        Number(id),
        incluirRespostas
      );
      
      return res.status(200).json({
        success: true,
        data: avaliacao,
      });
    } catch (error: any) {
      logger.error('Erro ao buscar avaliação', { error });
      return res.status(404).json({
        success: false,
        error: error.message || 'Avaliação não encontrada',
      });
    }
  }

  /**
   * Atualizar avaliação
   */
  async atualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dados = req.body;
      
      const avaliacao = await avaliacaoService.atualizarAvaliacao(Number(id), dados);
      
      return res.status(200).json({
        success: true,
        data: avaliacao,
        message: 'Avaliação atualizada com sucesso',
      });
    } catch (error: any) {
      logger.error('Erro ao atualizar avaliação', { error });
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao atualizar avaliação',
      });
    }
  }

  /**
   * Deletar avaliação
   */
  async deletar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resultado = await avaliacaoService.deletarAvaliacao(Number(id));
      
      return res.status(200).json({
        success: true,
        message: resultado.message,
      });
    } catch (error: any) {
      logger.error('Erro ao deletar avaliação', { error });
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao deletar avaliação',
      });
    }
  }

  /**
   * Listar avaliações disponíveis para o usuário
   */
  async listarDisponiveis(req: Request, res: Response) {
    try {
      const usuarioId = (req as any).userId;
      if (!usuarioId) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
        });
      }

      const avaliacoes = await avaliacaoService.listarAvaliacoesDisponiveis(usuarioId);
      
      return res.status(200).json({
        success: true,
        data: avaliacoes,
      });
    } catch (error: any) {
      logger.error('Erro ao listar avaliações disponíveis', { error });
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao listar avaliações disponíveis',
      });
    }
  }

  /**
   * Responder avaliação
   */
  async responder(req: Request, res: Response) {
    try {
      const dados = req.body;
      const resposta = await avaliacaoService.responderAvaliacao(dados);
      
      return res.status(201).json({
        success: true,
        data: resposta,
        message: 'Avaliação respondida com sucesso',
      });
    } catch (error: any) {
      logger.error('Erro ao responder avaliação', { error });
      
      if (error.message === 'Você já respondeu esta avaliação') {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao responder avaliação',
      });
    }
  }

  /**
   * Verificar se usuário já respondeu
   */
  async verificarResposta(req: Request, res: Response) {
    try {
      const { avaliacaoId, usuarioId } = req.params;
      
      const respondeu = await avaliacaoService.verificarResposta(
        Number(avaliacaoId),
        Number(usuarioId)
      );
      
      return res.status(200).json({
        success: true,
        data: { respondeu },
      });
    } catch (error: any) {
      logger.error('Erro ao verificar resposta', { error });
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao verificar resposta',
      });
    }
  }

  /**
   * Buscar respostas de uma avaliação
   */
  async buscarRespostas(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const respostas = await avaliacaoService.buscarRespostas(Number(id));
      
      return res.status(200).json({
        success: true,
        data: respostas,
      });
    } catch (error: any) {
      logger.error('Erro ao buscar respostas', { error });
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao buscar respostas',
      });
    }
  }

  /**
   * Gerar relatório de avaliação
   */
  async gerarRelatorio(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const relatorio = await avaliacaoService.gerarRelatorio(Number(id));
      
      return res.status(200).json({
        success: true,
        data: relatorio,
      });
    } catch (error: any) {
      logger.error('Erro ao gerar relatório', { error });
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao gerar relatório',
      });
    }
  }

  /**
   * Buscar avaliação ativa de uma jornada
   */
  async buscarAvaliacaoAtiva(req: Request, res: Response) {
    try {
      const { jornadaId } = req.params;
      const avaliacao = await avaliacaoService.buscarAvaliacaoAtiva(Number(jornadaId));
      
      if (!avaliacao) {
        return res.status(404).json({
          success: false,
          error: 'Nenhuma avaliação ativa encontrada para esta jornada',
        });
      }
      
      return res.status(200).json({
        success: true,
        data: avaliacao,
      });
    } catch (error: any) {
      logger.error('Erro ao buscar avaliação ativa', { error });
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao buscar avaliação ativa',
      });
    }
  }

  /**
   * Adicionar pergunta em todas as avaliações de uma jornada
   */
  async adicionarPerguntaEmTodasAvaliacoes(req: Request, res: Response) {
    try {
      const { jornadaId } = req.params;
      const dadosPergunta = req.body;
      
      const resultado = await avaliacaoService.adicionarPerguntaEmTodasAvaliacoes(
        Number(jornadaId),
        dadosPergunta
      );
      
      return res.status(201).json({
        success: true,
        message: resultado.message,
      });
    } catch (error: any) {
      logger.error('Erro ao adicionar pergunta', { error });
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao adicionar pergunta',
      });
    }
  }

  /**
   * Excluir pergunta por índice de todas as avaliações
   */
  async excluirPerguntaPorIndice(req: Request, res: Response) {
    try {
      const { jornadaId, indicePergunta } = req.params;
      
      const resultado = await avaliacaoService.excluirPerguntaPorIndice(
        Number(jornadaId),
        Number(indicePergunta)
      );
      
      return res.status(200).json({
        success: true,
        message: resultado.message,
      });
    } catch (error: any) {
      logger.error('Erro ao excluir pergunta', { error });
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao excluir pergunta',
      });
    }
  }

  /**
   * Mover pergunta em todas as avaliações
   */
  async moverPergunta(req: Request, res: Response) {
    try {
      const { jornadaId } = req.params;
      const { indiceOrigem, indiceDestino } = req.body;
      
      const resultado = await avaliacaoService.moverPergunta(
        Number(jornadaId),
        indiceOrigem,
        indiceDestino
      );
      
      return res.status(200).json({
        success: true,
        message: resultado.message,
      });
    } catch (error: any) {
      logger.error('Erro ao mover pergunta', { error });
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao mover pergunta',
      });
    }
  }
}

export const avaliacaoController = new AvaliacaoController();

