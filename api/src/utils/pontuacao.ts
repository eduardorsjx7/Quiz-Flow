/**
 * Calcula a pontuação de uma resposta baseada em:
 * - Acerto da questão
 * - Velocidade da resposta
 * 
 * @param pontosBase Pontos base por acerto
 * @param tempoResposta Tempo gasto para responder (em segundos)
 * @param tempoMaximo Tempo máximo permitido para a questão (em segundos)
 * @param acertou Se a resposta está correta
 * @returns Pontuação calculada
 */
export function calcularPontuacao(
  pontosBase: number,
  tempoResposta: number,
  tempoMaximo: number,
  acertou: boolean
): number {
  if (!acertou) {
    return 0;
  }

  // Bônus de rapidez: quanto mais rápido, maior o bônus
  // Fórmula: pontosBase + (tempoRestante / tempoMaximo) * pontosBase
  // Isso significa que responder instantaneamente dá 2x os pontos base
  // Responder no último segundo dá apenas os pontos base
  
  const tempoRestante = tempoMaximo - tempoResposta;
  const percentualTempoRestante = Math.max(0, tempoRestante / tempoMaximo);
  const bonusRapidez = percentualTempoRestante * pontosBase;
  
  const pontuacaoTotal = pontosBase + bonusRapidez;
  
  // Garantir que a pontuação seja sempre positiva
  return Math.round(Math.max(pontosBase, pontuacaoTotal));
}

/**
 * Calcula o tempo médio de resposta de um participante
 */
export function calcularTempoMedio(tempos: number[]): number {
  if (tempos.length === 0) return 0;
  const soma = tempos.reduce((acc, tempo) => acc + tempo, 0);
  return Math.round(soma / tempos.length);
}

/**
 * Calcula o percentual de acertos
 */
export function calcularPercentualAcertos(totalPerguntas: number, acertos: number): number {
  if (totalPerguntas === 0) return 0;
  return Math.round((acertos / totalPerguntas) * 100);
}

