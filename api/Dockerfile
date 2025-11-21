FROM node:18-slim

WORKDIR /app

# Instalar dependências necessárias (Debian já tem OpenSSL)
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    postgresql-client \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

# Copiar código
COPY . .

EXPOSE 3001

# Converter line endings e tornar scripts executáveis
RUN dos2unix src/scripts/*.sh 2>/dev/null || true && \
    chmod +x src/scripts/*.sh || true

# Script de inicialização - converter line endings e executar
CMD ["/bin/sh", "-c", "dos2unix src/scripts/start.sh 2>/dev/null || true; /bin/sh src/scripts/start.sh"]

