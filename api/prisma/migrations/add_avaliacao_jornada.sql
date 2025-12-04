-- Migration: Adicionar Sistema de Avaliação de Jornadas
-- Created: 2025-12-04

-- Criar enum para tipos de perguntas de avaliação
CREATE TYPE "TipoPerguntaAvaliacao" AS ENUM ('MULTIPLA_ESCOLHA', 'TEXTO_LIVRE', 'NOTA', 'SIM_NAO');

-- Tabela de Avaliações de Jornada
CREATE TABLE "avaliacoes_jornada" (
    "id" SERIAL PRIMARY KEY,
    "jornadaId" INTEGER NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN DEFAULT true,
    "obrigatorio" BOOLEAN DEFAULT false,
    "criadoPor" INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("jornadaId") REFERENCES "jornadas"("id") ON DELETE CASCADE
);

-- Tabela de Perguntas de Avaliação
CREATE TABLE "perguntas_avaliacao" (
    "id" SERIAL PRIMARY KEY,
    "avaliacaoId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "tipo" "TipoPerguntaAvaliacao" DEFAULT 'MULTIPLA_ESCOLHA',
    "ordem" INTEGER DEFAULT 0,
    "obrigatoria" BOOLEAN DEFAULT true,
    "peso" INTEGER DEFAULT 1,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("avaliacaoId") REFERENCES "avaliacoes_jornada"("id") ON DELETE CASCADE
);

-- Tabela de Alternativas de Avaliação
CREATE TABLE "alternativas_avaliacao" (
    "id" SERIAL PRIMARY KEY,
    "perguntaId" INTEGER NOT NULL,
    "texto" VARCHAR(255) NOT NULL,
    "valor" INTEGER DEFAULT 0,
    "ordem" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("perguntaId") REFERENCES "perguntas_avaliacao"("id") ON DELETE CASCADE
);

-- Tabela de Respostas de Avaliação
CREATE TABLE "respostas_avaliacao" (
    "id" SERIAL PRIMARY KEY,
    "avaliacaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "jornadaId" INTEGER NOT NULL,
    "respondidaEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("avaliacaoId") REFERENCES "avaliacoes_jornada"("id") ON DELETE CASCADE,
    FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE,
    UNIQUE ("avaliacaoId", "usuarioId")
);

-- Tabela de Respostas às Perguntas de Avaliação
CREATE TABLE "respostas_avaliacao_perguntas" (
    "id" SERIAL PRIMARY KEY,
    "respostaAvaliacaoId" INTEGER NOT NULL,
    "perguntaId" INTEGER NOT NULL,
    "alternativaId" INTEGER,
    "textoResposta" TEXT,
    "valorNota" INTEGER,
    "respondidaEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("respostaAvaliacaoId") REFERENCES "respostas_avaliacao"("id") ON DELETE CASCADE,
    FOREIGN KEY ("perguntaId") REFERENCES "perguntas_avaliacao"("id") ON DELETE CASCADE,
    FOREIGN KEY ("alternativaId") REFERENCES "alternativas_avaliacao"("id") ON DELETE SET NULL
);

-- Criar índices para melhor performance
CREATE INDEX "idx_avaliacoes_jornadaId" ON "avaliacoes_jornada"("jornadaId");
CREATE INDEX "idx_perguntas_avaliacaoId" ON "perguntas_avaliacao"("avaliacaoId");
CREATE INDEX "idx_alternativas_perguntaId" ON "alternativas_avaliacao"("perguntaId");
CREATE INDEX "idx_respostas_avaliacao_usuarioId" ON "respostas_avaliacao"("usuarioId");
CREATE INDEX "idx_respostas_avaliacao_jornadaId" ON "respostas_avaliacao"("jornadaId");
CREATE INDEX "idx_respostas_perguntas_respostaId" ON "respostas_avaliacao_perguntas"("respostaAvaliacaoId");

