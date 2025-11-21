import { IPontuacaoStrategy } from '../interfaces/strategy.interface';

/**
 * Estratégia base para cálculo de pontuação
 * Implementa o padrão Strategy Pattern
 */
export abstract class BasePontuacaoStrategy implements IPontuacaoStrategy {
  abstract calcularPontuacao(params: {
    tempoResposta: number;
    tempoMaximo: number;
    pontosBase: number;
    acertou: boolean;
  }): number;
}

/**
 * Estratégia de pontuação linear (tempo não afeta pontuação)
 */
export class PontuacaoLinearStrategy extends BasePontuacaoStrategy {
  calcularPontuacao(params: {
    tempoResposta: number;
    tempoMaximo: number;
    pontosBase: number;
    acertou: boolean;
  }): number {
    if (!params.acertou) {
      return 0;
    }
    return params.pontosBase;
  }
}

/**
 * Estratégia de pontuação baseada em tempo (quanto mais rápido, mais pontos)
 */
export class PontuacaoTempoStrategy extends BasePontuacaoStrategy {
  calcularPontuacao(params: {
    tempoResposta: number;
    tempoMaximo: number;
    pontosBase: number;
    acertou: boolean;
  }): number {
    if (!params.acertou) {
      return 0;
    }

    // Pontuação diminui linearmente com o tempo
    // Se respondeu em 0 segundos = pontosBase
    // Se respondeu em tempoMaximo = pontosBase * 0.5
    const fatorTempo = 1 - (params.tempoResposta / params.tempoMaximo) * 0.5;
    return Math.max(Math.floor(params.pontosBase * fatorTempo), Math.floor(params.pontosBase * 0.5));
  }
}

/**
 * Estratégia de pontuação exponencial (bonus maior para respostas muito rápidas)
 */
export class PontuacaoExponencialStrategy extends BasePontuacaoStrategy {
  calcularPontuacao(params: {
    tempoResposta: number;
    tempoMaximo: number;
    pontosBase: number;
    acertou: boolean;
  }): number {
    if (!params.acertou) {
      return 0;
    }

    // Pontuação com curva exponencial
    // Respostas muito rápidas recebem bonus significativo
    const tempoNormalizado = params.tempoResposta / params.tempoMaximo;
    const fatorTempo = Math.exp(-tempoNormalizado * 2); // Curva exponencial
    return Math.floor(params.pontosBase * (0.5 + fatorTempo * 0.5));
  }
}

