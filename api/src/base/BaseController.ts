import { Request, Response, NextFunction } from 'express';
import { IApiResponse } from '../interfaces/service.interface';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Classe base para controllers
 * Implementa padrões comuns de controllers REST
 */
export abstract class BaseController {
  /**
   * Resposta de sucesso padronizada
   */
  protected success<T>(res: Response, data: T, statusCode: number = 200): Response {
    const response: IApiResponse<T> = {
      success: true,
      data,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Resposta de erro padronizada
   */
  protected error(res: Response, message: string, statusCode: number = 400, code?: string): Response {
    const response: IApiResponse = {
      success: false,
      error: {
        message,
        code,
      },
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Resposta de criação bem-sucedida
   */
  protected created<T>(res: Response, data: T): Response {
    return this.success(res, data, 201);
  }

  /**
   * Resposta sem conteúdo
   */
  protected noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Wrapper para handlers assíncronos
   */
  protected asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return asyncHandler(fn);
  }

  /**
   * Extrai parâmetros de query com valores padrão
   */
  protected getQueryParams(req: Request) {
    return {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as string) || 'id',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };
  }

  /**
   * Extrai ID do usuário autenticado
   */
  protected getUserId(req: Request): number {
    if (!req.userId) {
      throw new Error('Usuário não autenticado');
    }
    return req.userId;
  }
}

