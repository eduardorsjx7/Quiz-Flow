import { IApiResponse } from '../interfaces/service.interface';
import { CustomError } from '../middleware/errorHandler';
import logger from '../config/logger';

/**
 * Classe base para serviços
 * Implementa o padrão Service Layer
 */
export abstract class BaseService {
  /**
   * Cria uma resposta padronizada da API
   */
  protected successResponse<T>(data: T, message?: string): IApiResponse<T> {
    return {
      success: true,
      data,
      ...(message && { message }),
    };
  }

  /**
   * Cria uma resposta de erro padronizada
   */
  protected errorResponse(message: string, code?: string, details?: any): IApiResponse {
    return {
      success: false,
      error: {
        message,
        code,
        details,
      },
    };
  }

  /**
   * Valida se um recurso existe
   */
  protected async validateResourceExists<T>(
    repository: { exists(id: number): Promise<boolean> },
    id: number,
    resourceName: string
  ): Promise<void> {
    const exists = await repository.exists(id);
    if (!exists) {
      throw new CustomError(`${resourceName} não encontrado(a)`, 404);
    }
  }

  /**
   * Trata erros de forma padronizada
   */
  protected handleError(error: any, context: string): never {
    logger.error(`Error in ${context}`, { error });
    
    if (error instanceof CustomError) {
      throw error;
    }

    throw new CustomError(
      `Erro ao processar ${context}: ${error.message}`,
      500
    );
  }
}

