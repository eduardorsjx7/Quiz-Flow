import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const requestId = (req as any).id || 'unknown';
  const userId = (req as any).userId || null;

  // Detectar erros específicos do Prisma/banco de dados
  const isDatabaseError = err.message?.includes('P1001') || // Connection error
                        err.message?.includes('P1002') || // Connection timeout
                        err.message?.includes('P1008') || // Operations timed out
                        err.message?.includes('P1017') || // Server has closed the connection
                        err.message?.includes('ECONNREFUSED') ||
                        err.message?.includes('Connection') ||
                        err.message?.includes('timeout') ||
                        err.message?.includes('pool') ||
                        (err as any).code === 'P1001' ||
                        (err as any).code === 'P1002' ||
                        (err as any).code === 'P1008' ||
                        (err as any).code === 'P1017';

  // Log detalhado do erro
  const errorLog: any = {
    requestId,
    statusCode,
    message,
    url: req.originalUrl,
    method: req.method,
    userId,
    timestamp: new Date().toISOString(),
    isDatabaseError,
  };

  // Adicionar informações específicas de erros de banco
  if (isDatabaseError) {
    errorLog.errorType = 'DATABASE_CONNECTION_ERROR';
    errorLog.errorCode = (err as any).code;
    errorLog.meta = (err as any).meta;
    logger.error('Database connection error detected', {
      ...errorLog,
      stack: err.stack,
      severity: 'HIGH',
    });
  } else {
    errorLog.stack = err.stack;
    logger.error('Error handled', errorLog);
  }

  // Resposta de erro
  res.status(statusCode).json({
    success: false,
    error: {
      message: isDatabaseError ? 'Erro de conexão com o banco de dados. Tente novamente.' : message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    requestId,
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
    },
  });
};

