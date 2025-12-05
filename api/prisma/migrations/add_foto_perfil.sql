-- Adicionar campo fotoPerfil na tabela usuarios
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "fotoPerfil" VARCHAR(500);

-- Comentário: Este campo armazena o caminho/URL da foto de perfil do usuário
COMMENT ON COLUMN "usuarios"."fotoPerfil" IS 'URL/caminho da foto de perfil do usuário (opcional)';

