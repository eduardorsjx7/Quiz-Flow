import { Request, Response, NextFunction } from 'express';
import { httpLogger } from '../config/logger';

interface RequestWithId extends Request {
  id?: string;
  startTime?: number;
}

// Gerar ID único para cada requisição
const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const requestLogger = (req: RequestWithId, res: Response, next: NextFunction) => {
  req.id = generateRequestId();
  req.startTime = Date.now();

  // Log da requisição recebida
  httpLogger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).userId || null,
  });

  // Interceptar o método res.end para logar a resposta
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const duration = Date.now() - (req.startTime || 0);

    httpLogger.info('Outgoing response', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') || 0,
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as RequestWithId).id || 'unknown';
  const duration = (req as RequestWithId).startTime 
    ? Date.now() - (req as RequestWithId).startTime! 
    : 0;

  httpLogger.error('Request error', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    error: {
      message: error.message,
      stack: error.stack,
    },
    duration: `${duration}ms`,
  });

  next(error);
};

