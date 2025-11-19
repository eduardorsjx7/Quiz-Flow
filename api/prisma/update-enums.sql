-- Script para atualizar ENUMs nas tabelas existentes

-- Criar ENUMs se não existirem
DO $$ BEGIN
    CREATE TYPE "TipoUsuario" AS ENUM ('ADMINISTRADOR', 'COLABORADOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "StatusSessao" AS ENUM ('AGUARDANDO', 'EM_ANDAMENTO', 'FINALIZADA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Atualizar tabela usuarios se necessário
DO $$ 
BEGIN
    -- Verificar se a coluna tipo é VARCHAR e converter para ENUM
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'tipo' 
        AND data_type = 'character varying'
    ) THEN
        -- Remover DEFAULT temporariamente
        ALTER TABLE usuarios ALTER COLUMN tipo DROP DEFAULT;
        -- Converter valores existentes e alterar tipo
        ALTER TABLE usuarios 
        ALTER COLUMN tipo TYPE "TipoUsuario" 
        USING tipo::"TipoUsuario";
        -- Restaurar DEFAULT
        ALTER TABLE usuarios ALTER COLUMN tipo SET DEFAULT 'COLABORADOR'::"TipoUsuario";
    END IF;
END $$;

-- Atualizar tabela sessoes_quiz se necessário
DO $$ 
BEGIN
    -- Verificar se a coluna status é VARCHAR e converter para ENUM
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessoes_quiz' 
        AND column_name = 'status' 
        AND data_type = 'character varying'
    ) THEN
        -- Remover DEFAULT temporariamente
        ALTER TABLE sessoes_quiz ALTER COLUMN status DROP DEFAULT;
        -- Converter valores existentes e alterar tipo
        ALTER TABLE sessoes_quiz 
        ALTER COLUMN status TYPE "StatusSessao" 
        USING status::"StatusSessao";
        -- Restaurar DEFAULT
        ALTER TABLE sessoes_quiz ALTER COLUMN status SET DEFAULT 'AGUARDANDO'::"StatusSessao";
    END IF;
END $$;

