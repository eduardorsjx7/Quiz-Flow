import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import logger from '../config/logger';
import config from '../config/env';
import { CustomError, asyncHandler } from '../middleware/errorHandler';

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    throw new CustomError('Email e senha são obrigatórios', 400);
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!usuario || !usuario.senha) {
    logger.warn('Login attempt with invalid credentials', { email });
    throw new CustomError('Credenciais inválidas', 401);
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    logger.warn('Login attempt with invalid password', { email, userId: usuario.id });
    throw new CustomError('Credenciais inválidas', 401);
  }

  const token = jwt.sign(
    { userId: usuario.id, tipo: usuario.tipo },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  logger.info('User logged in successfully', { userId: usuario.id, email });

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
  const userId = (req as any).userId;

  if (!userId) {
    throw new CustomError('Usuário não autenticado', 401);
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nome: true,
      email: true,
      tipo: true,
    },
  });

  if (!usuario) {
    throw new CustomError('Usuário não encontrado', 404);
  }

  res.json({
    success: true,
    data: usuario,
  });
});

