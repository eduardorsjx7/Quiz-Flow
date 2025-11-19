// Utilitários de pontuação (versão frontend para referência)
// A lógica real está no backend

export function calcularPontuacao(
  pontosBase: number,
  tempoResposta: number,
  tempoMaximo: number,
  acertou: boolean
): number {
  if (!acertou) {
    return 0;
  }

  const tempoRestante = tempoMaximo - tempoResposta;
  const percentualTempoRestante = Math.max(0, tempoRestante / tempoMaximo);
  const bonusRapidez = percentualTempoRestante * pontosBase;
  
  const pontuacaoTotal = pontosBase + bonusRapidez;
  
  return Math.round(Math.max(pontosBase, pontuacaoTotal));
}

