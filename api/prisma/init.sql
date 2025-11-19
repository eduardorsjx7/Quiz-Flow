-- Script de inicialização do banco de dados
-- Este script cria as tabelas necessárias se não existirem

-- Criar extensão para UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar ENUMs
DO $$ BEGIN
    CREATE TYPE "TipoUsuario" AS ENUM ('ADMINISTRADOR', 'COLABORADOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "StatusTentativa" AS ENUM ('EM_ANDAMENTO', 'FINALIZADA', 'ABANDONADA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela de grupos/departamentos
CREATE TABLE IF NOT EXISTS grupos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    matricula VARCHAR(255),
    senha VARCHAR(255),
    tipo "TipoUsuario" DEFAULT 'COLABORADOR',
    "grupoId" INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("grupoId") REFERENCES grupos(id) ON DELETE SET NULL
);

-- Tabela de jornadas
CREATE TABLE IF NOT EXISTS jornadas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    "criadoPor" INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de fases
CREATE TABLE IF NOT EXISTS fases (
    id SERIAL PRIMARY KEY,
    "jornadaId" INTEGER NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    "criadoPor" INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("jornadaId") REFERENCES jornadas(id) ON DELETE CASCADE
);

-- Tabela de quizzes
CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    "faseId" INTEGER NOT NULL,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    "pontosBase" INTEGER DEFAULT 100,
    tags VARCHAR(500),
    "dataInicio" TIMESTAMP,
    "dataFim" TIMESTAMP,
    "criadoPor" INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("faseId") REFERENCES fases(id) ON DELETE CASCADE
);

-- Tabela de atribuições de quiz
CREATE TABLE IF NOT EXISTS atribuicoes_quiz (
    id SERIAL PRIMARY KEY,
    "quizId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "grupoId" INTEGER,
    "atribuidoPor" INTEGER,
    "atribuidoEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("quizId") REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY ("usuarioId") REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY ("grupoId") REFERENCES grupos(id) ON DELETE CASCADE
);

-- Tabela de desbloqueios de fase
CREATE TABLE IF NOT EXISTS desbloqueios_fase (
    id SERIAL PRIMARY KEY,
    "faseId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "faseAtual" BOOLEAN DEFAULT false,
    "desbloqueadoPor" INTEGER,
    "desbloqueadoEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("faseId") REFERENCES fases(id) ON DELETE CASCADE,
    FOREIGN KEY ("usuarioId") REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE("faseId", "usuarioId")
);

-- Tabela de perguntas
CREATE TABLE IF NOT EXISTS perguntas (
    id SERIAL PRIMARY KEY,
    "quizId" INTEGER NOT NULL,
    texto TEXT NOT NULL,
    "tempoSegundos" INTEGER DEFAULT 30,
    ordem INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("quizId") REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Tabela de alternativas
CREATE TABLE IF NOT EXISTS alternativas (
    id SERIAL PRIMARY KEY,
    "perguntaId" INTEGER NOT NULL,
    texto TEXT NOT NULL,
    correta BOOLEAN DEFAULT false,
    ordem INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("perguntaId") REFERENCES perguntas(id) ON DELETE CASCADE
);

-- Tabela de tentativas de quiz (substitui sessões)
CREATE TABLE IF NOT EXISTS tentativas_quiz (
    id SERIAL PRIMARY KEY,
    "quizId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    status "StatusTentativa" DEFAULT 'EM_ANDAMENTO',
    "iniciadaEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "finalizadaEm" TIMESTAMP,
    "pontuacaoTotal" INTEGER DEFAULT 0,
    "tempoTotal" INTEGER DEFAULT 0,
    "posicaoRanking" INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("quizId") REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY ("usuarioId") REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE("quizId", "usuarioId")
);

-- Tabela de respostas
CREATE TABLE IF NOT EXISTS respostas (
    id SERIAL PRIMARY KEY,
    "tentativaId" INTEGER NOT NULL,
    "perguntaId" INTEGER NOT NULL,
    "alternativaId" INTEGER,
    "tempoResposta" INTEGER NOT NULL,
    pontuacao INTEGER DEFAULT 0,
    acertou BOOLEAN DEFAULT false,
    "tempoEsgotado" BOOLEAN DEFAULT false,
    "respondidaEm" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("tentativaId") REFERENCES tentativas_quiz(id) ON DELETE CASCADE,
    FOREIGN KEY ("perguntaId") REFERENCES perguntas(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_fases_jornada_id ON fases("jornadaId");
CREATE INDEX IF NOT EXISTS idx_quizzes_fase_id ON quizzes("faseId");
CREATE INDEX IF NOT EXISTS idx_quizzes_data_inicio ON quizzes("dataInicio");
CREATE INDEX IF NOT EXISTS idx_quizzes_data_fim ON quizzes("dataFim");
CREATE INDEX IF NOT EXISTS idx_perguntas_quiz_id ON perguntas("quizId");
CREATE INDEX IF NOT EXISTS idx_alternativas_pergunta_id ON alternativas("perguntaId");
CREATE INDEX IF NOT EXISTS idx_desbloqueios_fase_usuario ON desbloqueios_fase("faseId", "usuarioId");
CREATE INDEX IF NOT EXISTS idx_desbloqueios_fase_atual ON desbloqueios_fase("usuarioId", "faseAtual");
CREATE INDEX IF NOT EXISTS idx_tentativas_quiz_usuario ON tentativas_quiz("quizId", "usuarioId");
CREATE INDEX IF NOT EXISTS idx_tentativas_usuario_id ON tentativas_quiz("usuarioId");
CREATE INDEX IF NOT EXISTS idx_atribuicoes_quiz_usuario ON atribuicoes_quiz("quizId", "usuarioId");
CREATE INDEX IF NOT EXISTS idx_atribuicoes_quiz_grupo ON atribuicoes_quiz("quizId", "grupoId");
CREATE INDEX IF NOT EXISTS idx_respostas_tentativa_id ON respostas("tentativaId");
CREATE INDEX IF NOT EXISTS idx_usuarios_grupo_id ON usuarios("grupoId");

