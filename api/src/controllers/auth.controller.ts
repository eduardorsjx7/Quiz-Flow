import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import logger from '../config/logger';
import config from '../config/env';
import { CustomError, asyncHandler } from '../middleware/errorHandler';

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const { email, senha } = req.body;

  logger.info('Login attempt started', {
    requestId,
    email,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  });

  if (!email || !senha) {
    logger.warn('Login attempt failed: Missing credentials', {
      requestId,
      hasEmail: !!email,
      hasSenha: !!senha,
      ip: req.ip,
    });
    throw new CustomError('Email e senha são obrigatórios', 400);
  }

  let usuario;
  try {
    usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    logger.debug('User lookup completed', {
      requestId,
      email,
      userFound: !!usuario,
      userId: usuario?.id,
      hasPassword: !!usuario?.senha,
    });
  } catch (dbError: any) {
    logger.error('Database error during user lookup', {
      requestId,
      email,
      error: dbError.message,
      stack: dbError.stack,
    });
    throw dbError;
  }

  if (!usuario || !usuario.senha) {
    logger.warn('Login attempt failed: Invalid credentials', {
      requestId,
      email,
      userExists: !!usuario,
      hasPassword: !!usuario?.senha,
      ip: req.ip,
    });
    throw new CustomError('Credenciais inválidas', 401);
  }

  let senhaValida = false;
  try {
    senhaValida = await bcrypt.compare(senha, usuario.senha);
    logger.debug('Password comparison completed', {
      requestId,
      email,
      userId: usuario.id,
      passwordValid: senhaValida,
    });
  } catch (bcryptError: any) {
    logger.error('Error during password comparison', {
      requestId,
      email,
      userId: usuario.id,
      error: bcryptError.message,
      stack: bcryptError.stack,
    });
    throw new CustomError('Erro ao validar senha', 500);
  }

  if (!senhaValida) {
    logger.warn('Login attempt failed: Invalid password', {
      requestId,
      email,
      userId: usuario.id,
      ip: req.ip,
    });
    throw new CustomError('Credenciais inválidas', 401);
  }

  let token: string;
  try {
    const tokenPayload = {
      userId: usuario.id,
      tipo: usuario.tipo,
    };

    logger.debug('Generating JWT token', {
      requestId,
      userId: usuario.id,
      userTipo: usuario.tipo,
      jwtSecretLength: config.JWT_SECRET?.length || 0,
      jwtExpiresIn: config.JWT_EXPIRES_IN,
    });

    token = jwt.sign(
      tokenPayload,
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    // Decodificar para obter informações de expiração
    const decoded = jwt.decode(token) as any;
    const expirationDate = decoded?.exp ? new Date(decoded.exp * 1000) : null;

    logger.info('JWT token generated successfully', {
      requestId,
      userId: usuario.id,
      email,
      tokenLength: token.length,
      expiresIn: config.JWT_EXPIRES_IN,
      expirationDate: expirationDate?.toISOString(),
      currentTime: new Date().toISOString(),
    });
  } catch (tokenError: any) {
    logger.error('Error generating JWT token', {
      requestId,
      userId: usuario.id,
      email,
      error: tokenError.message,
      stack: tokenError.stack,
      jwtSecretLength: config.JWT_SECRET?.length || 0,
    });
    throw new CustomError('Erro ao gerar token de autenticação', 500);
  }

  const duration = Date.now() - startTime;
  logger.info('User logged in successfully', {
    requestId,
    userId: usuario.id,
    email,
    tipo: usuario.tipo,
    duration: `${duration}ms`,
    ip: req.ip,
  });

  res.json({
    success: true,
    data: {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
      },
    },
  });
});

export const criarAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    throw new CustomError('Nome, email e senha são obrigatórios', 400);
  }

  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (usuarioExistente) {
    throw new CustomError('Email já cadastrado', 409);
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senha: senhaHash,
      tipo: 'ADMINISTRADOR',
    },
  });

  logger.info('Admin user created', { userId: usuario.id, email });

  res.status(201).json({
    success: true,
    message: 'Administrador criado com sucesso',
    data: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    },
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const userId = (req as any).userId;

  logger.debug('getMe request started', {
    requestId,
    userId,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  if (!userId) {
    logger.warn('getMe failed: No userId in request', {
      requestId,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      headers: {
        authorization: req.headers.authorization ? 'present' : 'missing',
      },
    });
    throw new CustomError('Usuário não autenticado', 401);
  }

  let usuario;
  try {
    usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
      },
    });

    logger.debug('User lookup completed in getMe', {
      requestId,
      userId,
      userFound: !!usuario,
    });
  } catch (dbError: any) {
    logger.error('Database error in getMe', {
      requestId,
      userId,
      error: dbError.message,
      stack: dbError.stack,
      code: dbError.code,
    });
    throw dbError;
  }

  if (!usuario) {
    logger.warn('getMe failed: User not found', {
      requestId,
      userId,
      url: req.originalUrl,
      ip: req.ip,
    });
    throw new CustomError('Usuário não encontrado', 404);
  }

  const duration = Date.now() - startTime;
  logger.info('getMe request successful', {
    requestId,
    userId: usuario.id,
    email: usuario.email,
    tipo: usuario.tipo,
    duration: `${duration}ms`,
  });

  res.json({
    success: true,
    data: usuario,
  });
});

export const listarUsuarios = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      tipo: true,
    },
    orderBy: {
      nome: 'asc',
    },
  });

  res.json({
    success: true,
    data: usuarios,
  });
});

export const criarUsuario = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { nome, email, senha, tipo } = req.body;

  if (!nome || !email || !senha) {
    throw new CustomError('Nome, email e senha são obrigatórios', 400);
  }

  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (usuarioExistente) {
    throw new CustomError('Email já cadastrado', 409);
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senha: senhaHash,
      tipo: tipo || 'COLABORADOR',
    },
    select: {
      id: true,
      nome: true,
      email: true,
      tipo: true,
    },
  });

  logger.info('User created', { userId: usuario.id, email, tipo });

  res.status(201).json({
    success: true,
    message: 'Usuário criado com sucesso',
    data: usuario,
  });
});

export const deletarUsuario = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = parseInt(id);

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
  });

  if (!usuario) {
    throw new CustomError('Usuário não encontrado', 404);
  }

  // Não permitir deletar a si mesmo
  const currentUserId = (req as any).userId;
  if (currentUserId === userId) {
    throw new CustomError('Você não pode deletar seu próprio usuário', 400);
  }

  await prisma.usuario.delete({
    where: { id: userId },
  });

  logger.info('User deleted', { userId });

  res.json({
    success: true,
    message: 'Usuário deletado com sucesso',
  });
});

