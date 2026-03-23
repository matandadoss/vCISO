# vCISO Admin Portal Deployment Script
Write-Host "====================================="
Write-Host " Building vCISO Admin Portal"
Write-Host "====================================="

# Navigate to project directory
Set-Location -Path "c:\Users\matan\iCloudDrive\vCISO\admin-portal"

# Run Production Build
Write-Host "Running Vite build..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Please check errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "Build successful." -ForegroundColor Green
Write-Host "====================================="
Write-Host " Deploying to Firebase Hosting"
Write-Host "====================================="
Write-Host "Note: This will deploy to your default Firebase project: gen-lang-client-0873796692"
Write-Host "Because this uses Firebase Hosting, it operates on a separate infrastructure layer from your Cloud Run backend."

# Run Firebase deploy (Requires firebase-tools globally installed and authenticated)
npx firebase-tools deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Deployment failed. Ensure you are logged in to Firebase (npx firebase login)." -ForegroundColor Red
}
