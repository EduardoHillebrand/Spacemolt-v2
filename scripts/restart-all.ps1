# Reinicia o SpaceMolt agent inteiro: para tudo que estiver rodando e sobe de novo do
# zero. Precisa rodar elevado (mesmo motivo de stop-all.ps1 -- os processos rodam como
# SYSTEM). Equivalente a: parar tudo manualmente + Start-ScheduledTask "SpaceMoltAgent".
#
# Uso: powershell -ExecutionPolicy Bypass -File scripts\restart-all.ps1

$Root = "D:\claude\spacemolt"

& (Join-Path $Root "scripts\stop-all.ps1")

Write-Host "Aguardando as portas liberarem..."
Start-Sleep -Seconds 3

$Task = Get-ScheduledTask -TaskName "SpaceMoltAgent" -ErrorAction SilentlyContinue
if ($Task) {
    Write-Host "Disparando via Task Scheduler (SpaceMoltAgent)..."
    Start-ScheduledTask -TaskName "SpaceMoltAgent"
} else {
    Write-Host "Tarefa 'SpaceMoltAgent' não encontrada -- subindo direto via start-all.ps1."
    & (Join-Path $Root "scripts\start-all.ps1")
}

Write-Host "Reinício disparado."
