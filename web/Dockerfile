FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependências primeiro para aproveitar cache do Docker
COPY package*.json ./

# Limpar cache do npm
RUN npm cache clean --force

# Instalar todas as dependências do package.json
# Usando --legacy-peer-deps para resolver conflitos de peer dependencies
RUN npm install --legacy-peer-deps

# Limpar cache de build
RUN rm -rf node_modules/.cache

# Copiar script de entrada primeiro (antes de copiar tudo)
COPY docker-entrypoint.sh /tmp/docker-entrypoint.sh
RUN sed -i 's/\r$//' /tmp/docker-entrypoint.sh && \
    cp /tmp/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh && \
    rm /tmp/docker-entrypoint.sh

# Copiar o resto dos arquivos
COPY . .

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]

