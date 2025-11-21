import {
  BasePontuacaoStrategy,
  PontuacaoLinearStrategy,
  PontuacaoTempoStrategy,
  PontuacaoExponencialStrategy,
} from '../strategies/PontuacaoStrategy';
import { IPontuacaoStrategy } from '../interfaces/strategy.interface';

/**
 * Factory para criar estratégias de pontuação
 * Implementa o padrão Factory Pattern
 */
export type TipoPontuacao = 'linear' | 'tempo' | 'exponencial';

export class PontuacaoFactory {
  private static strategies: Map<TipoPontuacao, IPontuacaoStrategy> = new Map([
    ['linear', new PontuacaoLinearStrategy()],
    ['tempo', new PontuacaoTempoStrategy()],
    ['exponencial', new PontuacaoExponencialStrategy()],
  ]);

  /**
   * Cria uma estratégia de pontuação baseada no tipo
   */
  static create(tipo: TipoPontuacao = 'linear'): IPontuacaoStrategy {
    const strategy = this.strategies.get(tipo);
    if (!strategy) {
      throw new Error(`Tipo de estratégia de pontuação não encontrado: ${tipo}`);
    }
    return strategy;
  }

  /**
   * Registra uma nova estratégia customizada
   */
  static register(tipo: TipoPontuacao, strategy: IPontuacaoStrategy): void {
    this.strategies.set(tipo, strategy);
  }
}

