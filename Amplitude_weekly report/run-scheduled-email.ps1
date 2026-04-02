# 매주 실행용: send_email.py 발송
# 작업 스케줄러에서 이 스크립트만 호출하면 됩니다.

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $scriptDir

$logDir = Join-Path $scriptDir "logs"
if (-not (Test-Path -LiteralPath $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}
$logFile = Join-Path $logDir "weekly-send.log"

function Write-Log {
    param([string]$Message)
    $line = "{0} {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
    Add-Content -LiteralPath $logFile -Value $line -Encoding utf8
    Write-Host $line
}

try {
    Write-Log "===== 주간 리포트 발송 시작 ====="

    $sendScript = Join-Path $scriptDir "send_email.py"
    if (-not (Test-Path -LiteralPath $sendScript)) {
        throw "send_email.py 를 찾을 수 없습니다: $sendScript"
    }

    $pythonExe = $null
    if (Get-Command py -ErrorAction SilentlyContinue) {
        $pythonExe = "py"
    } elseif (Get-Command python -ErrorAction SilentlyContinue) {
        $pythonExe = "python"
    } else {
        throw "Python(py 또는 python)을 PATH에서 찾을 수 없습니다. Python 설치 후 다시 시도하세요."
    }

    $pyPrefix = @()
    if ($pythonExe -eq "py") {
        $pyPrefix = @("-3")
    }

    # send_email.py 가 선택(또는 자동) 기간으로 Amplitude 조회 → generate_analysis → 발송을 수행합니다.
    $sendArgs = @($pyPrefix + @($sendScript))
    Write-Log "실행: $pythonExe $($sendArgs -join ' ')"

    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $output = & $pythonExe @sendArgs 2>&1
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $oldEap

    if ($null -ne $output) {
        foreach ($line in @($output)) {
            Write-Log "$line"
        }
    }

    if ($null -eq $exitCode) { $exitCode = 0 }
    if ($exitCode -ne 0) {
        Write-Log "실패: 프로세스 종료 코드 $exitCode"
        exit $exitCode
    }

    Write-Log "===== 주간 리포트 발송 정상 종료 ====="
    exit 0
} catch {
    Write-Log "오류: $($_.Exception.Message)"
    Write-Log $_.ScriptStackTrace
    exit 1
}
