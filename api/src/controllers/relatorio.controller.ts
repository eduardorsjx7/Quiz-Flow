import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import relatorioService from '../services/relatorio.service';
import { calcularPercentualAcertos } from '../utils/pontuacao';
import { asyncHandler } from '../middleware/errorHandler';

export const relatorioPorQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = req.params;
  const relatorio = await relatorioService.relatorioPorQuiz(parseInt(quizId));
  res.json({
    success: true,
    data: relatorio,
  });
});

export const relatorioPorColaborador = asyncHandler(async (req: Request, res: Response) => {
  const { usuarioId } = req.params;
  const relatorio = await relatorioService.relatorioPorColaborador(parseInt(usuarioId));
  res.json({
    success: true,
    data: relatorio,
  });
});

export const relatorioPorPergunta = asyncHandler(async (req: Request, res: Response) => {
  const { perguntaId } = req.params;
  const relatorio = await relatorioService.relatorioPorPergunta(parseInt(perguntaId));
  res.json({
    success: true,
    data: relatorio,
  });
});

export const exportarCSV = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = req.params;
  const dados = await relatorioService.dadosParaExportacaoCSV(parseInt(quizId));

  // Criar CSV manualmente
  const headers = [
    'Sessão',
    'Nome',
    'Matrícula',
    'Pontuação',
    'Tempo Total (s)',
    'Acertos',
    'Total Perguntas',
    '% Acertos',
  ];
  const csvRows = [headers.join(',')];

  for (const item of dados) {
    const row = [
      item.sessao,
      `"${item.nome}"`,
      item.matricula,
      item.pontuacao,
      item.tempoTotal,
      item.acertos,
      item.totalPerguntas,
      item.percentualAcertos,
    ];
    csvRows.push(row.join(','));
  }

  const csv = csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=relatorio-quiz.csv');
  res.send('\ufeff' + csv); // BOM para Excel
});

export const exportarPDF = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = req.params;
  const relatorio = await relatorioService.relatorioPorQuiz(parseInt(quizId));

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=relatorio-quiz.pdf');
  doc.pipe(res);

  doc.fontSize(20).text('Relatório de Quiz', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`Quiz: ${relatorio.quiz.titulo || 'N/A'}`, { align: 'left' });
  doc.moveDown();

  for (const sessao of relatorio.sessoes) {
    doc.fontSize(16).text(`Sessão: ${sessao.codigo}`);
    doc.moveDown(0.5);
    doc.fontSize(12);

    let y = doc.y;
    doc.text('Posição', 50, y);
    doc.text('Nome', 120, y);
    doc.text('Pontuação', 250, y);
    doc.text('Acertos', 330, y);
    doc.text('% Acertos', 400, y);
    doc.moveDown();

    for (let i = 0; i < sessao.participantes.length; i++) {
      const p = sessao.participantes[i];

      doc.text(`${i + 1}`, 50);
      doc.text(p.nome.substring(0, 20), 120);
      doc.text(p.pontuacao.toString(), 250);
      doc.text(`${p.acertos}/${p.totalPerguntas}`, 330);
      doc.text(`${p.percentualAcertos}%`, 400);
      doc.moveDown();

      if (doc.y > 700) {
        doc.addPage();
      }
    }

    doc.moveDown();
    if (doc.y > 700) {
      doc.addPage();
    }
  }

  doc.end();
});

