-- Adicionar campos de configuração à tabela jornadas
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS "mostrarQuestaoCerta" BOOLEAN DEFAULT true;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS "mostrarTaxaErro" BOOLEAN DEFAULT true;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS "mostrarPodio" BOOLEAN DEFAULT true;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS "mostrarRanking" BOOLEAN DEFAULT true;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS "permitirTentativasIlimitadas" BOOLEAN DEFAULT false;
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS "tempoLimitePorQuestao" INTEGER;

-- Adicionar campos de desbloqueio e pontuação à tabela fases
ALTER TABLE fases ADD COLUMN IF NOT EXISTS "dataDesbloqueio" TIMESTAMP;
ALTER TABLE fases ADD COLUMN IF NOT EXISTS "pontuacao" INTEGER DEFAULT 0;

