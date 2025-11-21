import { Request, Response, NextFunction } from 'express';
import { ValidatorFactory } from '../factories/ValidatorFactory';
import { CustomError } from './errorHandler';

/**
 * Middleware para validação usando Strategy Pattern
 * Implementa o padrão Middleware Pattern
 */
export const validate = (validatorType: 'quiz' | 'fase' | 'jornada' | 'usuario') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validator = ValidatorFactory.create(validatorType);
      const validation = await validator.validate(req.body);

      if (!validation.isValid) {
        const errors = validation.errors.map(e => e.message).join(', ');
        return next(new CustomError(`Validação falhou: ${errors}`, 400));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

