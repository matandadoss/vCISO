$ErrorActionPreference = "Stop"
$ROOT_DIR = "c:\Users\matan\iCloudDrive\vCISO"

Write-Host "========================================="
Write-Host "vCISO Unattended Admin Portal Deployment"
Write-Host "========================================="
Write-Host ""

Set-Location -Path $ROOT_DIR

# Trigger Deployment Start SMS Alert
try {
    python .\backend\scripts\send_deployment_sms.py "vCISO Admin Portal deployment has started..."
} catch {
    Write-Host "Warning: Failed to transmit start SMS."
}

Write-Host "Running local Vite build..."
Set-Location -Path ".\admin-portal"
npm run build

if ($LASTEXITCODE -ne 0) {
    Set-Location -Path $ROOT_DIR
    try { python .\backend\scripts\send_deployment_sms.py "ALERT: Admin portal deployment FAILED during build phase!" } catch {}
    Write-Error "Build failed! Please check errors before deploying."
    exit 1
}

Write-Host "Build successful." -ForegroundColor Green
Write-Host ""
Write-Host "========================================="
Write-Host " Deploying to Firebase Hosting"
Write-Host "========================================="
Write-Host "Note: This will deploy to your default Firebase project."
Write-Host "Because this uses Firebase Hosting, it operates on a separate infrastructure layer from your Cloud Run backend."
Write-Host ""

# Run Firebase deploy
npx firebase-tools deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Set-Location -Path $ROOT_DIR
    Write-Host ""
    Write-Host "========================================="
    Write-Host "Deployment completed successfully!"
    Write-Host "========================================="
    try { python .\backend\scripts\send_deployment_sms.py "vCISO Admin Portal deployment completed successfully!" } catch {}
} else {
    Set-Location -Path $ROOT_DIR
    try { python .\backend\scripts\send_deployment_sms.py "ALERT: Admin portal deployment FAILED during Firebase upload process!" } catch {}
    Write-Error "Deployment failed. Ensure you are logged in to Firebase (npx firebase login)."
    exit 1
}
