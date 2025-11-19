import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import logger from '../config/logger';
import { CustomError } from './errorHandler';

interface TokenPayload {
  userId: number;
  tipo: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userTipo?: string;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new CustomError('Token não fornecido', 401);
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    req.userId = decoded.userId;
    req.userTipo = decoded.tipo;

    next();
  } catch (error: any) {
    if (error instanceof CustomError) {
      return next(error);
    }
    logger.warn('Invalid token', { error: error.message });
    next(new CustomError('Token inválido', 401));
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.userTipo !== 'ADMINISTRADOR') {
    logger.warn('Unauthorized admin access attempt', {
      userId: req.userId,
      userTipo: req.userTipo,
      url: req.originalUrl,
    });
    return next(new CustomError('Acesso negado. Apenas administradores.', 403));
  }
  next();
};
