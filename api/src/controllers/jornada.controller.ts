import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jornadaService from '../services/jornada.service';
import { asyncHandler } from '../middleware/errorHandler';

// Configurar storage do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/jornadas';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `jornada-${uniqueSuffix}${ext}`);
  },
});

// Filtro para aceitar apenas imagens
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const listarJornadas = asyncHandler(async (req: Request, res: Response) => {
  const jornadas = await jornadaService.listarJornadas();
  res.json({
    success: true,
    data: jornadas,
  });
});

export const buscarJornadaPorId = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const jornada = await jornadaService.buscarPorId(Number(id));
  res.json({
    success: true,
    data: jornada,
  });
});

export const buscarFasesPorJornada = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const usuarioId = req.userId;
  const resultado = await jornadaService.buscarFasesPorJornada(Number(id), usuarioId);
  res.json({
    success: true,
    data: resultado,
  });
});

export const criarJornada = asyncHandler(async (req: Request, res: Response) => {
  const { titulo, descricao, ordem, fases } = req.body;
  const criadoPor = req.userId;
  
  // Processar fases se vierem como string JSON (do FormData)
  let fasesArray = fases;
  if (typeof fases === 'string') {
    try {
      fasesArray = JSON.parse(fases);
    } catch (error) {
      fasesArray = [];
    }
  }

  // Obter caminho da imagem se foi enviada
  const imagemCapa = req.file ? `/uploads/jornadas/${req.file.filename}` : null;

  const jornada = await jornadaService.criarJornada({
    titulo,
    descricao,
    imagemCapa,
    ordem,
    criadoPor,
    fases: fasesArray,
  });

  res.status(201).json({
    success: true,
    data: jornada,
  });
});

export const atualizarJornada = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { titulo, descricao, ordem, ativo } = req.body;

  // Obter caminho da imagem se foi enviada
  const imagemCapa = req.file ? `/uploads/jornadas/${req.file.filename}` : undefined;

  const dadosAtualizacao: any = {
    titulo,
    descricao,
    ordem,
    ativo,
  };

  // Só adiciona imagemCapa se uma nova imagem foi enviada
  if (imagemCapa) {
    dadosAtualizacao.imagemCapa = imagemCapa;
  }

  const jornada = await jornadaService.atualizarJornada(Number(id), dadosAtualizacao);

  res.json({
    success: true,
    data: jornada,
  });
});

export const deletarJornada = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await jornadaService.deletarJornada(Number(id));
  res.json({
    success: true,
    message: 'Jornada deletada com sucesso',
  });
});

export const obterEstatisticasCompletas = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const estatisticas = await jornadaService.obterEstatisticasCompletas(Number(id));
  res.json({
    success: true,
    data: estatisticas,
  });
});

export const buscarConfiguracao = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const configuracao = await jornadaService.buscarConfiguracao(Number(id));
  res.json({
    success: true,
    data: configuracao,
  });
});

export const salvarConfiguracao = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fases, configuracao } = req.body;

  const resultado = await jornadaService.salvarConfiguracao(Number(id), {
    fases,
    configuracao,
  });

  res.json({
    success: true,
    data: resultado,
  });
});

