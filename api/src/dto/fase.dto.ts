/**
 * Data Transfer Objects para Fase
 */
export interface CreateFaseDTO {
  jornadaId: number;
  titulo: string;
  descricao?: string;
  ordem?: number;
}

export interface UpdateFaseDTO {
  titulo?: string;
  descricao?: string;
  ordem?: number;
  ativo?: boolean;
}

export interface FaseQueryDTO {
  jornadaId?: number;
  ativo?: boolean;
  apenasFaseAtual?: boolean;
}

