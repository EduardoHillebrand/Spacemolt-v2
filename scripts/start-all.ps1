# Sobe o sistema do SpaceMolt agent inteiro de uma vez: canal de devlog (0005), pagina de
# diretriz (0012), e o loop de cada conta (0006). Pensado pra ser chamado pelo Task
# Scheduler no logon/boot -- cada processo sobe com Start-Process (desacoplado), sobrevive
# mesmo depois que este script termina.
#
# Uso manual: powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = "D:\claude\spacemolt"
$Node = "D:\nodejs\node.exe"
$LogDir = Join-Path $Root "run-logs"

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

function Start-Managed {
    param(
        [string]$Name,
        [string[]]$NodeArgs
    )
    $out = Join-Path $LogDir "$Name.out.log"
    $err = Join-Path $LogDir "$Name.err.log"
    Start-Process -FilePath $Node -ArgumentList $NodeArgs -WorkingDirectory $Root `
        -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err
    Write-Host "[$Name] iniciado (log em $out / $err)"
}

# Canal de devlog -- sobe primeiro; os outros reconectam sozinhos se ainda não estiver de
# pé (client.ts/subscriber.ts já tratam isso), então a ordem exata não é crítica.
Start-Managed -Name "devlog-server" -NodeArgs @("--import", "tsx", "scripts/run-devlog-server.ts")
Start-Sleep -Seconds 3

# Página de diretriz + feed ao vivo (precisa do .env com DIRECTIVES_USER/DIRECTIVES_PASS).
Start-Managed -Name "directives-server" -NodeArgs @("--env-file=.env", "--import", "tsx", "scripts/run-directives-server.ts")

# Loop de cada conta (spec 0006). Habilitado em 2026-11-15 a pedido do usuário, mesmo sem
# nenhuma skill (0007-0011) ter passado por validação manual contra o jogo real ainda
# (specs/0007-skill-mining/tasks.md em diante) -- ações reais no jogo, sem supervisão,
# reiniciando sozinho a cada boot. Ver log/decisoes.md.
Start-Managed -Name "hillebot" -NodeArgs @("--import", "tsx", "app/main.ts", "hillebot")
Start-Managed -Name "ironvex"  -NodeArgs @("--import", "tsx", "app/main.ts", "ironvex")
Start-Managed -Name "medici"   -NodeArgs @("--import", "tsx", "app/main.ts", "medici")

Write-Host "Tudo que está habilitado foi iniciado."
