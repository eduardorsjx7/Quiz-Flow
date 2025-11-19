#!/bin/sh

set -e

# Aguardar PostgreSQL estar pronto
until nc -z postgres 5432 2>/dev/null; do
  sleep 2
done

# Criar .env
echo "DATABASE_URL=$DATABASE_URL" > .env

# Criar schema temporário para gerar Prisma Client
sed "s|env(DATABASE_URL)|\"$DATABASE_URL\"|g" prisma/schema.prisma > prisma/schema.temp.prisma

# Gerar Prisma Client
npx prisma generate --schema=prisma/schema.temp.prisma > /dev/null 2>&1
rm -f prisma/schema.temp.prisma

# Criar tabelas via SQL
PGPASSWORD=quizpassword psql -h postgres -U quizuser -d quizflow -f prisma/init.sql > /dev/null 2>&1
[ -f "prisma/update-enums.sql" ] && PGPASSWORD=quizpassword psql -h postgres -U quizuser -d quizflow -f prisma/update-enums.sql > /dev/null 2>&1 || true

# Inicializar banco (criar admin se não existir)
npm run init-db > /dev/null 2>&1 || true

# Iniciar servidor
npm run dev
