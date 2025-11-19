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
    'Nome',
    'Matrícula',
    'Pontuação',
    'Tempo Total (s)',
    'Acertos',
    'Total Perguntas',
    '% Acertos',
    'Posição Ranking',
    'Data Finalização',
  ];
  const csvRows = [headers.join(',')];

  for (const item of dados) {
    const row = [
      `"${item.nome}"`,
      item.matricula,
      item.pontuacao,
      item.tempoTotal,
      item.acertos,
      item.totalPerguntas,
      item.percentualAcertos,
      item.posicaoRanking,
      item.dataFinalizacao ? new Date(item.dataFinalizacao).toLocaleString('pt-BR') : '',
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

  doc.fontSize(12);
  let y = doc.y;
  doc.text('Posição', 50, y);
  doc.text('Nome', 120, y);
  doc.text('Matrícula', 200, y);
  doc.text('Pontuação', 280, y);
  doc.text('Acertos', 350, y);
  doc.text('% Acertos', 420, y);
  doc.text('Tempo Total', 500, y);
  doc.moveDown();

  for (let i = 0; i < relatorio.tentativas.length; i++) {
    const t = relatorio.tentativas[i];

    doc.text(`${t.posicao}`, 50);
    doc.text(t.usuario.nome.substring(0, 20), 120);
    doc.text(t.usuario.matricula || '-', 200);
    doc.text(t.pontuacao.toString(), 280);
    doc.text(`${t.acertos}/${t.totalPerguntas}`, 350);
    doc.text(`${t.percentualAcertos}%`, 420);
    doc.text(`${t.tempoTotal}s`, 500);
    doc.moveDown();

    if (doc.y > 700) {
      doc.addPage();
      y = doc.y;
      doc.text('Posição', 50, y);
      doc.text('Nome', 120, y);
      doc.text('Matrícula', 200, y);
      doc.text('Pontuação', 280, y);
      doc.text('Acertos', 350, y);
      doc.text('% Acertos', 420, y);
      doc.text('Tempo Total', 500, y);
      doc.moveDown();
    }
  }

  doc.end();
});

