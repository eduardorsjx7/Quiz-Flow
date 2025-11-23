-- Adicionar campo imagemCapa à tabela jornadas
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS "imagemCapa" TEXT;

