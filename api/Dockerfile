FROM node:18-slim

WORKDIR /app

# Instalar dependências necessárias (Debian já tem OpenSSL)
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

# Copiar código
COPY . .

EXPOSE 3001

# Tornar scripts executáveis
RUN chmod +x src/scripts/*.sh || true

# Script de inicialização - usar shell para garantir que variáveis de ambiente sejam passadas
CMD ["/bin/sh", "-c", "exec src/scripts/start.sh"]

