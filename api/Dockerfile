FROM node:18-alpine

WORKDIR /app

# Instalar netcat para wait script (PostgreSQL não precisa de OpenSSL especial)
RUN apk add --no-cache netcat-openbsd

COPY package*.json ./
RUN npm install

# Copiar schema do Prisma
COPY prisma ./prisma

# Gerar Prisma Client durante o build
# Criar schema temporário com URL hardcoded (Prisma Client não precisa de conexão real)
RUN sed 's|env(DATABASE_URL)|"postgresql://user:password@localhost:5432/database"|g' prisma/schema.prisma > prisma/schema.temp.prisma && \
    npx prisma generate --schema=prisma/schema.temp.prisma && \
    rm -f prisma/schema.temp.prisma

# Copiar resto dos arquivos
COPY . .

EXPOSE 3001

# Tornar scripts executáveis
RUN chmod +x src/scripts/*.sh || true

# Script de inicialização - usar shell para garantir que variáveis de ambiente sejam passadas
CMD ["/bin/sh", "-c", "exec src/scripts/start.sh"]

