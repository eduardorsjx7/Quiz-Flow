-- Adicionar campo nomeExibicao na tabela usuarios
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "nomeExibicao" VARCHAR(255);

-- Comentário: Este campo será usado para exibir o nome do usuário nos rankings
COMMENT ON COLUMN "usuarios"."nomeExibicao" IS 'Nome que aparece nos rankings (opcional)';


