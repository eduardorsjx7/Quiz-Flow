#!/bin/bash

echo "Aguardando MySQL estar pronto..."
sleep 10

echo "Gerando cliente Prisma..."
npm run prisma:generate

echo "Executando migrations..."
npm run prisma:migrate:deploy

echo "Inicializando banco de dados..."
npm run init-db

echo "Setup concluído!"

