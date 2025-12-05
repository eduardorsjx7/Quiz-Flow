-- Adicionar campo faseId na tabela avaliacoes_jornada
ALTER TABLE "avaliacoes_jornada" ADD COLUMN IF NOT EXISTS "faseId" INTEGER;

-- Adicionar foreign key para a tabela fases
ALTER TABLE "avaliacoes_jornada" 
ADD CONSTRAINT "avaliacoes_jornada_faseId_fkey" 
FOREIGN KEY ("faseId") REFERENCES "fases"("id") ON DELETE CASCADE;

-- Comentário: Este campo identifica qual fase esta avaliação avalia (null se for avaliação geral da jornada)
COMMENT ON COLUMN "avaliacoes_jornada"."faseId" IS 'ID da fase que esta avaliação avalia (null se for avaliação geral da jornada)';

