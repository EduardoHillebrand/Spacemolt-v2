# Registra a tarefa do Windows que sobe o SpaceMolt agent inteiro (devlog server, pagina
# de diretriz, e os 3 loops de conta) na inicializacao do PC, antes mesmo de alguem logar.
# Precisa rodar como Administrador (clique com o botao direito no PowerShell -> "Executar
# como administrador", depois rode este script) -- criar uma tarefa que roda como SYSTEM
# exige elevacao; por isso nao guarda nenhuma senha sua do Windows.
#
# Uso: powershell -ExecutionPolicy Bypass -File scripts\register-startup-task.ps1

$TaskName = "SpaceMoltAgent"
$ScriptPath = "D:\claude\spacemolt\scripts\start-all.ps1"

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
    -Principal $principal -Settings $settings `
    -Description "Sobe devlog server, pagina de diretriz e os 3 loops de conta do SpaceMolt agent"

Write-Host "Tarefa '$TaskName' registrada. Vai rodar na proxima inicializacao do PC."
Write-Host "Pra testar agora sem reiniciar: Start-ScheduledTask -TaskName '$TaskName'"
