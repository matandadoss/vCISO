$ErrorActionPreference = "Continue"

# Master Orchestrator Initialization
$LogFile = "c:\Users\matan\iCloudDrive\vCISO\master_schedule.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$CurrentHour = (Get-Date).Hour

Set-Location "c:\Users\matan\iCloudDrive\vCISO"

Write-Output "" | Out-File -FilePath $LogFile -Append
Write-Output "=================================================" | Out-File -FilePath $LogFile -Append
Write-Output "[$Timestamp] vCISO MASTER SCHEDULE TRIGGERED" | Out-File -FilePath $LogFile -Append
Write-Output "=================================================" | Out-File -FilePath $LogFile -Append

# -----------------------------------------------------
# TASK: Hourly Autonomous Production Deployment Scan
# -----------------------------------------------------
Write-Output "[$Timestamp] [TASK 1] Executing Hourly Git Deployment Validator..." | Out-File -FilePath $LogFile -Append
try {
    .\deploy_hourly.ps1
} catch {
    Write-Output "[$Timestamp] [ERROR] Critical failure executing deploy_hourly.ps1 pipeline." | Out-File -FilePath $LogFile -Append
}

# -----------------------------------------------------
# TASK 2: Nightly Global Vendor Risk Analytics
# -----------------------------------------------------
if ($CurrentHour -eq 2) { # Execute only at 2:00 AM
    Write-Output "[$Timestamp] [TASK 2] Initiating Global Vendor Risk Batch Drift Processing..." | Out-File -FilePath $LogFile -Append
    try {
        Set-Location "c:\Users\matan\iCloudDrive\vCISO\backend"
        $PythonPath = ".\venv\Scripts\python.exe"
        if (-Not (Test-Path $PythonPath)) {
            $PythonPath = "python"
        }
        & $PythonPath scripts\batch_vendor_drift.py >> $LogFile 2>&1
        Set-Location "c:\Users\matan\iCloudDrive\vCISO"
    } catch {
        Write-Output "[$Timestamp] [ERROR] Failed to execute Global Vendor Drift." | Out-File -FilePath $LogFile -Append
        Set-Location "c:\Users\matan\iCloudDrive\vCISO"
    }
} 

Write-Output "[$Timestamp] MASTER SCHEDULE CYCLE COMPLETED" | Out-File -FilePath $LogFile -Append
Write-Output "=================================================" | Out-File -FilePath $LogFile -Append
