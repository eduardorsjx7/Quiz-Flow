#!/bin/sh

set -e

echo "=== Iniciando Quiz Flow API ==="

# Aguardar PostgreSQL estar pronto
echo "Aguardando PostgreSQL estar pronto..."
until nc -z postgres 5432; do
  echo "PostgreSQL não está pronto ainda. Aguardando..."
  sleep 2
done
echo "✓ PostgreSQL está pronto!"

# Verificar se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
  echo "ERRO: DATABASE_URL não está definida!"
  echo "Variáveis de ambiente disponíveis:"
  env | grep -E "(DATABASE|POSTGRES)" || echo "Nenhuma variável relacionada encontrada"
  exit 1
fi

echo "DATABASE_URL definida: ${DATABASE_URL%%@*}" # Mostrar sem senha completa

# Exportar explicitamente para garantir que esteja disponível
export DATABASE_URL

# Remover qualquer arquivo .env existente em prisma/ para evitar conflitos
rm -f prisma/.env

# Criar arquivo .env apenas na raiz (Prisma lê da raiz do projeto)
echo "DATABASE_URL=$DATABASE_URL" > .env
echo "Criado arquivo .env na raiz"

# O Prisma Client já foi gerado durante o build, então pulamos a geração aqui
# Apenas verificamos se o cliente existe
echo "Verificando Prisma Client..."
if [ ! -d "node_modules/.prisma/client" ]; then
  echo "Prisma Client não encontrado, gerando..."
  env DATABASE_URL="$DATABASE_URL" npx prisma generate
else
  echo "✓ Prisma Client já existe"
fi

# Executar migrations
echo "Executando migrations..."
npx prisma migrate deploy

# Inicializar banco de dados
echo "Inicializando banco de dados..."
npm run init-db

# Iniciar servidor
echo "Iniciando servidor..."
npm run dev

