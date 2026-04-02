# Windows 작업 스케줄러에 주간 리포트 자동 발송 작업을 등록합니다.
# 프로젝트 루트 .env 의 SCHEDULE_* 값을 사용합니다. 명령줄 인자가 있으면 그쪽이 우선합니다.
#
# 사용법:
#   powershell -ExecutionPolicy Bypass -File .\register-weekly-report-task.ps1
#
# 옵션(선택, .env 보다 우선):
#   .\register-weekly-report-task.ps1 -TaskName "MyTask" -DayOfWeek Tuesday -Time "08:30"

param(
    [string]$TaskName,
    [string]$DayOfWeek,
    [string]$Time
)

$ErrorActionPreference = "Stop"

function Read-MailEnvFile {
    param([string]$LiteralPath)
    $dict = @{}
    if (-not (Test-Path -LiteralPath $LiteralPath)) { return $dict }
    foreach ($raw in Get-Content -LiteralPath $LiteralPath -Encoding UTF8) {
        $line = $raw.Trim()
        if (-not $line -or $line.StartsWith('#')) { continue }
        $idx = $line.IndexOf('=')
        if ($idx -lt 1) { continue }
        $key = $line.Substring(0, $idx).Trim()
        $val = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
        if ($key) { $dict[$key] = $val }
    }
    return $dict
}

function Resolve-DayOfWeek {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) { return 'Monday' }
    $v = $Value.Trim()
    foreach ($name in [System.Enum]::GetNames([System.DayOfWeek])) {
        if ($name.Equals($v, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $name
        }
    }
    $lower = $v.ToLowerInvariant()
    switch -Regex ($lower) {
        '^(mon|mo)$' { return 'Monday' }
        '^(tue|tu)$' { return 'Tuesday' }
        '^(wed|we)$' { return 'Wednesday' }
        '^(thu|th)$' { return 'Thursday' }
        '^(fri|fr)$' { return 'Friday' }
        '^(sat|sa)$' { return 'Saturday' }
        '^(sun|su)$' { return 'Sunday' }
    }
    throw "SCHEDULE_DAY_OF_WEEK: Monday ... Sunday (English). Got: $Value"
}

function Normalize-TimeHHmm {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) { return '09:00' }
    $s = $Value.Trim()
    if ($s -notmatch '^\d{1,2}:\d{1,2}$') {
        throw "SCHEDULE_TIME format is HH:mm (e.g. 09:00): $Value"
    }
    $culture = [System.Globalization.CultureInfo]::InvariantCulture
    $formats = [string[]]@('H:mm', 'HH:mm', 'H:m', 'HH:m')
    $t = [datetime]::ParseExact($s, $formats, $culture, [System.Globalization.DateTimeStyles]::None)
    return $t.ToString('HH:mm', $culture)
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dotEnvPath = Join-Path $scriptDir ".env"
$envFromFile = Read-MailEnvFile $dotEnvPath

$finalTaskName = 'Amplitude-Weekly-AI-Report'
if ($PSBoundParameters.ContainsKey('TaskName') -and -not [string]::IsNullOrWhiteSpace($TaskName)) {
    $finalTaskName = $TaskName.Trim()
} elseif ($envFromFile['SCHEDULE_TASK_NAME'] -and $envFromFile['SCHEDULE_TASK_NAME'].Trim()) {
    $finalTaskName = $envFromFile['SCHEDULE_TASK_NAME'].Trim()
}

$rawDay = $null
if ($PSBoundParameters.ContainsKey('DayOfWeek') -and -not [string]::IsNullOrWhiteSpace($DayOfWeek)) {
    $rawDay = $DayOfWeek
} elseif ($envFromFile['SCHEDULE_DAY_OF_WEEK'] -and $envFromFile['SCHEDULE_DAY_OF_WEEK'].Trim()) {
    $rawDay = $envFromFile['SCHEDULE_DAY_OF_WEEK'].Trim()
}
$finalDay = Resolve-DayOfWeek $rawDay

$rawTime = $null
if ($PSBoundParameters.ContainsKey('Time') -and -not [string]::IsNullOrWhiteSpace($Time)) {
    $rawTime = $Time
} elseif ($envFromFile['SCHEDULE_TIME'] -and $envFromFile['SCHEDULE_TIME'].Trim()) {
    $rawTime = $envFromFile['SCHEDULE_TIME'].Trim()
}
$finalTime = Normalize-TimeHHmm $rawTime

$runScriptPath = Join-Path $scriptDir "run-scheduled-email.ps1"
if (-not (Test-Path -LiteralPath $runScriptPath)) {
    throw "run-scheduled-email.ps1 not found: $runScriptPath"
}

$culture = [System.Globalization.CultureInfo]::InvariantCulture
$triggerTime = [datetime]::ParseExact($finalTime, "HH:mm", $culture)
$today = [datetime]::Today
$at = $today.Date.Add($triggerTime.TimeOfDay)

$actionArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$runScriptPath`""

try {
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $actionArgs -WorkingDirectory $scriptDir
} catch {
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $actionArgs
}

$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $finalDay -At $at

$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Limited

$settings = New-ScheduledTaskSettingsSet `
    -Compatibility Win8 `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

$description = "Amplitude weekly report email (.env SCHEDULE_*). Every $finalDay $finalTime"

Register-ScheduledTask `
    -TaskName $finalTaskName `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description $description `
    -Force | Out-Null

Write-Host ""
Write-Host "Schedule registered."
Write-Host "  Task name: $finalTaskName"
Write-Host "  Run: every $finalDay at $finalTime"
if (Test-Path -LiteralPath $dotEnvPath) {
    Write-Host "  Config: $dotEnvPath (SCHEDULE_*)"
}
Write-Host "  Script: $runScriptPath"
Write-Host ""
Write-Host "Task Scheduler: taskschd.msc -> Task Scheduler Library -> $finalTaskName"
Write-Host "Log: $scriptDir\logs\weekly-send.log"
Write-Host ""
