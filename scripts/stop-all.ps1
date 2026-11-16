# Para todos os processos do SpaceMolt agent subidos por scripts/start-all.ps1 (devlog
# server, pagina de diretriz, loop de cada conta) -- identifica pela linha de comando,
# nunca mata um node.exe de outra coisa (ex. o tsserver do editor). Como os processos rodam
# como SYSTEM (scripts/register-startup-task.ps1), este script precisa rodar elevado
# (PowerShell como Administrador), senao "Access is denied" em cada Stop-Process.
#
# Uso: powershell -ExecutionPolicy Bypass -File scripts\stop-all.ps1

$Patterns = @(
    "run-devlog-server.ts",
    "run-directives-server.ts",
    "app/main.ts"
)

$Procs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object {
    $cmd = $_.CommandLine
    if (-not $cmd) { return $false }
    foreach ($p in $Patterns) { if ($cmd -like "*$p*") { return $true } }
    return $false
}

if (-not $Procs -or $Procs.Count -eq 0) {
    Write-Host "Nenhum processo do SpaceMolt agent encontrado rodando."
    exit 0
}

foreach ($p in $Procs) {
    Write-Host "Parando PID $($p.ProcessId): $($p.CommandLine)"
    Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop
}

Write-Host "Parados: $($Procs.Count) processo(s)."
