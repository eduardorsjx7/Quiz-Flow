#!/bin/bash
# Script para subir containers de forma silenciosa

echo "Iniciando containers..."
docker-compose up -d --quiet-pull 2>/dev/null

echo "Aguardando serviços iniciarem..."
sleep 5

echo "✓ Containers iniciados"
echo ""
echo "Serviços disponíveis:"
echo "  - Frontend: http://localhost:3000"
echo "  - API: http://localhost:3001"
echo "  - PostgreSQL: localhost:5432"
echo ""
echo "Para ver logs: docker-compose logs -f"
echo "Para parar: docker-compose down"

