/**
 * Interface base para estratégias
 * Implementa o padrão Strategy Pattern
 */
export interface IStrategy<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput> | TOutput;
}

/**
 * Interface para estratégias de cálculo de pontuação
 */
export interface IPontuacaoStrategy {
  calcularPontuacao(params: {
    tempoResposta: number;
    tempoMaximo: number;
    pontosBase: number;
    acertou: boolean;
  }): number;
}

/**
 * Interface para estratégias de filtragem
 */
export interface IFilterStrategy<T> {
  apply(data: T[], filters: any): T[];
}

