import { IValidator } from '../interfaces/validator.interface';
import { QuizValidator } from '../validators/QuizValidator';
import { BaseValidator } from '../validators/BaseValidator';

/**
 * Factory para criar validadores
 * Implementa o padrão Factory Pattern
 */
export type TipoValidator = 'quiz' | 'fase' | 'jornada' | 'usuario';

export class ValidatorFactory {
  /**
   * Cria um validador baseado no tipo
   */
  static create(tipo: TipoValidator): IValidator<any> {
    switch (tipo) {
      case 'quiz':
        return new QuizValidator();
      // Adicionar outros validadores conforme necessário
      default:
        throw new Error(`Tipo de validador não encontrado: ${tipo}`);
    }
  }
}

