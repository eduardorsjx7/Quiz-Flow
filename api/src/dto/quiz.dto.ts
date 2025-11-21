/**
 * Data Transfer Objects para Quiz
 * Implementa o padrão DTO Pattern
 */

export interface CreateQuizDTO {
  titulo: string;
  descricao?: string;
  faseId: number;
  ordem?: number;
  pontosBase?: number;
  tags?: string;
  dataInicio?: Date;
  dataFim?: Date;
  perguntas: CreatePerguntaDTO[];
}

export interface UpdateQuizDTO {
  titulo?: string;
  descricao?: string;
  faseId?: number;
  ordem?: number;
  pontosBase?: number;
  tags?: string;
  dataInicio?: Date;
  dataFim?: Date;
  ativo?: boolean;
}

export interface CreatePerguntaDTO {
  texto: string;
  tempoSegundos?: number;
  alternativas: CreateAlternativaDTO[];
}

export interface CreateAlternativaDTO {
  texto: string;
  correta: boolean;
}

export interface QuizQueryDTO {
  faseId?: number;
  ativo?: boolean;
  tags?: string;
}

