import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import logger from '../config/logger';
import { CustomError } from './errorHandler';
import prisma from '../config/database';

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

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.debug('Authentication attempt started', {
      requestId,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('Authentication failed: No authorization header', {
        requestId,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });
      throw new CustomError('Token não fornecido', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Authentication failed: Token not found in header', {
        requestId,
        url: req.originalUrl,
        method: req.method,
        authHeaderFormat: authHeader.substring(0, 20) + '...',
        ip: req.ip,
      });
      throw new CustomError('Token não fornecido', 401);
    }

    logger.debug('Token extracted, attempting verification', {
      requestId,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 10) + '...',
      jwtSecretLength: config.JWT_SECRET?.length || 0,
      jwtExpiresIn: config.JWT_EXPIRES_IN,
    });

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
      
      logger.debug('Token verified successfully', {
        requestId,
        userId: decoded.userId,
        userTipo: decoded.tipo,
        tokenExpiration: (decoded as any).exp ? new Date((decoded as any).exp * 1000).toISOString() : 'unknown',
        currentTime: new Date().toISOString(),
      });
    } catch (jwtError: any) {
      const errorDetails = {
        requestId,
        errorName: jwtError.name,
        errorMessage: jwtError.message,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...',
        currentTime: new Date().toISOString(),
        jwtExpiresIn: config.JWT_EXPIRES_IN,
      };

      if (jwtError.name === 'TokenExpiredError') {
        logger.warn('Authentication failed: Token expired', {
          ...errorDetails,
          expiredAt: jwtError.expiredAt ? new Date(jwtError.expiredAt).toISOString() : 'unknown',
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        logger.error('Authentication failed: Invalid token format', errorDetails);
      } else if (jwtError.name === 'NotBeforeError') {
        logger.warn('Authentication failed: Token not active yet', {
          ...errorDetails,
          notBefore: jwtError.date ? new Date(jwtError.date).toISOString() : 'unknown',
        });
      } else {
        logger.error('Authentication failed: Unknown JWT error', {
          ...errorDetails,
          stack: jwtError.stack,
        });
      }

      throw jwtError;
    }

    req.userId = decoded.userId;
    req.userTipo = decoded.tipo;

    // Verificar se o usuário ainda existe no banco (opcional, mas ajuda a detectar problemas)
    try {
      const userExists = await prisma.usuario.findUnique({
        where: { id: decoded.userId },
        select: { id: true },
      });

      if (!userExists) {
        logger.warn('Authentication failed: User not found in database', {
          requestId,
          userId: decoded.userId,
          url: req.originalUrl,
          method: req.method,
        });
        throw new CustomError('Usuário não encontrado', 401);
      }
    } catch (dbError: any) {
      // Se for erro de conexão do banco, logar detalhadamente
      if (dbError.code?.startsWith('P') || dbError.message?.includes('Connection')) {
        logger.error('Database connection error during authentication', {
          requestId,
          userId: decoded.userId,
          error: dbError.message,
          code: dbError.code,
          stack: dbError.stack,
          url: req.originalUrl,
          method: req.method,
        });
        throw new CustomError('Erro de conexão com o banco de dados', 503);
      }
      // Se for erro de usuário não encontrado, já foi tratado acima
      throw dbError;
    }

    const duration = Date.now() - startTime;
    logger.info('Authentication successful', {
      requestId,
      userId: decoded.userId,
      userTipo: decoded.tipo,
      url: req.originalUrl,
      method: req.method,
      duration: `${duration}ms`,
    });

    next();
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error instanceof CustomError) {
      logger.warn('Authentication failed: Custom error', {
        requestId,
        error: error.message,
        statusCode: error.statusCode,
        url: req.originalUrl,
        method: req.method,
        duration: `${duration}ms`,
      });
      return next(error);
    }
    
    logger.error('Authentication failed: Unexpected error', {
      requestId,
      error: error.message,
      errorName: error.name,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      duration: `${duration}ms`,
    });
    
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
