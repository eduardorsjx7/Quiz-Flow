FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

# Limpar cache e reinstalar se necessário
RUN rm -rf node_modules/.cache

COPY . .

EXPOSE 3000

CMD ["npm", "start"]

