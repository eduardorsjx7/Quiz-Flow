# Script PowerShell para subir containers de forma silenciosa

Write-Host "Iniciando containers..." -ForegroundColor Green
docker-compose up -d --quiet-pull 2>$null

Write-Host "Aguardando serviços iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n✓ Containers iniciados" -ForegroundColor Green
Write-Host ""
Write-Host "Serviços disponíveis:" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:3000"
Write-Host "  - API: http://localhost:3001"
Write-Host "  - PostgreSQL: localhost:5432"
Write-Host ""
Write-Host "Para ver logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "Para parar: docker-compose down" -ForegroundColor Yellow

