$ErrorActionPreference = "Stop"

# Log initialization
$LogFile = "c:\Users\matan\iCloudDrive\vCISO\hourly_deploy.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Set-Location "c:\Users\matan\iCloudDrive\vCISO"

Write-Output "[$Timestamp] Hourly Deployment Check Started" | Out-File -FilePath $LogFile -Append

# Evaluate Git Tree Status
$changes = git status --porcelain

if ($changes) {
    Write-Output "[$Timestamp] Pending changes detected. Committing and deploying to GCP..." | Out-File -FilePath $LogFile -Append
    
    try {
        # Optional: Safely push local commits to ensure branch parity before the build triggers
        git add .
        git commit -m "Auto-commit: Preparing for hourly production rollout"
        git push origin main
    } catch {
        Write-Output "[$Timestamp] Warning: Git merge or push failed, deploying local environment anyway." | Out-File -FilePath $LogFile -Append
    }
    
    # Trigger the primary deployment configuration
    try {
        .\deploy_prod.ps1 | Out-File -FilePath $LogFile -Append
    } catch {
        Write-Output "[$Timestamp] ERROR: Cloud Run deployment script failed!" | Out-File -FilePath $LogFile -Append
        exit 1
    }
} else {
    Write-Output "[$Timestamp] Clean working tree. Skipping deployment." | Out-File -FilePath $LogFile -Append
}
