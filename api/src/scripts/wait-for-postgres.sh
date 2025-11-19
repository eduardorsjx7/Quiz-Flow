#!/bin/sh

echo "Aguardando PostgreSQL estar pronto..."
until nc -z postgres 5432; do
  echo "PostgreSQL não está pronto ainda. Aguardando..."
  sleep 2
done
echo "PostgreSQL está pronto!"

