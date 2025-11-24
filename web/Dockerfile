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

# Copiar o resto dos arquivos
COPY . .

# Copiar e configurar script de entrada
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]

