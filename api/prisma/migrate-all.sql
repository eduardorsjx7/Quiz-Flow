-- Migração completa: Adicionar campos de imagem de capa e configuração de jornadas/fases
-- Execute este script no banco de dados PostgreSQL

-- 1. Adicionar campo imagemCapa à tabela jornadas
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS "imagemCapa" TEXT;

-- 2. Adicionar campos de configuração à tabela jornadas
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS "mostrarQuestaoCerta" BOOLEAN DEFAULT true;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS "mostrarTaxaErro" BOOLEAN DEFAULT true;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS "mostrarPodio" BOOLEAN DEFAULT true;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS "mostrarRanking" BOOLEAN DEFAULT true;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS "permitirTentativasIlimitadas" BOOLEAN DEFAULT false;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS "tempoLimitePorQuestao" INTEGER;

-- 3. Adicionar campos de desbloqueio, bloqueio e pontuação à tabela fases
ALTER TABLE fases ADD COLUMN IF NOT EXISTS "dataDesbloqueio" TIMESTAMP;
ALTER TABLE fases ADD COLUMN IF NOT EXISTS "dataBloqueio" TIMESTAMP;
ALTER TABLE fases ADD COLUMN IF NOT EXISTS "pontuacao" INTEGER DEFAULT 0;

-- Verificar se as colunas foram criadas
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'jornadas' 
    AND column_name IN ('imagemCapa', 'mostrarQuestaoCerta', 'mostrarTaxaErro', 'mostrarPodio', 'mostrarRanking', 'permitirTentativasIlimitadas', 'tempoLimitePorQuestao')
ORDER BY column_name;

SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'fases' 
    AND column_name IN ('dataDesbloqueio', 'dataBloqueio', 'pontuacao')
ORDER BY column_name;

