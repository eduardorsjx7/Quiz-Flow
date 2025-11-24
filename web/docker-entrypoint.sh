#!/bin/sh
set -e

cd /app

# Verificar se node_modules existe e tem as dependências necessárias
if [ ! -d "node_modules" ] || [ ! -d "node_modules/react-slick" ] || [ ! -d "node_modules/slick-carousel" ]; then
  echo "Instalando dependências..."
  npm install --legacy-peer-deps
  echo "Dependências instaladas com sucesso!"
fi

# Executar o comando passado como argumento
exec "$@"

