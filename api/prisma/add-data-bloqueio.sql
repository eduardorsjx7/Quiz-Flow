-- Migração: Adicionar campo dataBloqueio à tabela fases
-- Execute este script no banco de dados PostgreSQL

ALTER TABLE fases ADD COLUMN IF NOT EXISTS "dataBloqueio" TIMESTAMP;

-- Verificar se a coluna foi criada
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'fases' 
    AND column_name = 'dataBloqueio';



