# start-optimized.ps1 - Script otimizado para desenvolvimento (Windows)
# Configurar variáveis de ambiente para reduzir consumo de memória
$env:NODE_OPTIONS = "--max-old-space-size=2048"
$env:EXPO_MAX_WORKERS = "2"
$env:METRO_MAX_WORKERS = "2"

Write-Host "🚀 Iniciando servidor otimizado..." -ForegroundColor Green
Write-Host "💾 Configurações de memória aplicadas:" -ForegroundColor Yellow
Write-Host "   - NODE_OPTIONS: $env:NODE_OPTIONS" -ForegroundColor Cyan
Write-Host "   - EXPO_MAX_WORKERS: $env:EXPO_MAX_WORKERS" -ForegroundColor Cyan
Write-Host "   - METRO_MAX_WORKERS: $env:METRO_MAX_WORKERS" -ForegroundColor Cyan
Write-Host ""

# Limpar cache do Metro antes de iniciar
Write-Host "🧹 Limpando cache do Metro..." -ForegroundColor Cyan
npx expo start --clear --max-workers=2

Write-Host ""
Write-Host "✅ Servidor iniciado com otimizações!" -ForegroundColor Green
Write-Host "📱 Acesse: http://localhost:8081" -ForegroundColor Blue
