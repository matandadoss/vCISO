$ErrorActionPreference = "Stop"

Write-Host "========================================="
Write-Host "vCISO Unattended Production Deployment"
Write-Host "========================================="
Write-Host ""

# Trigger Deployment Start SMS Alert
try {
    python .\backend\scripts\send_deployment_sms.py "vCISO Cloud Run deployment has started..."
} catch {
    Write-Host "Warning: Failed to transmit start SMS."
}

$PROJECT_ID = gcloud config get-value project
Write-Host "Using Project ID: $PROJECT_ID"
Write-Host ""

Write-Host "[1/4] Building and pushing Backend image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/vciso-backend .\backend
if ($LASTEXITCODE -ne 0) { 
    try { python .\backend\scripts\send_deployment_sms.py "ALERT: Cloud Run deployment FAILED during Backend build! Check GCP console immediately." } catch {}
    Write-Error "Backend build failed"
    exit $LASTEXITCODE 
}

Write-Host "[2/4] Deploying Backend to Cloud Run..."
gcloud run deploy vciso-backend --image gcr.io/$PROJECT_ID/vciso-backend --region us-central1 --platform managed --allow-unauthenticated --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID
if ($LASTEXITCODE -ne 0) { 
    try { python .\backend\scripts\send_deployment_sms.py "ALERT: Cloud Run deployment FAILED during Backend deployment phase!" } catch {}
    Write-Error "Backend deployment failed"
    exit $LASTEXITCODE 
}

Write-Host "[3/4] Building and pushing Frontend image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/vciso-frontend .\frontend
if ($LASTEXITCODE -ne 0) { 
    try { python .\backend\scripts\send_deployment_sms.py "ALERT: Cloud Run deployment FAILED during Frontend build phase!" } catch {}
    Write-Error "Frontend build failed"
    exit $LASTEXITCODE 
}

Write-Host "[4/4] Deploying Frontend to Cloud Run..."
gcloud run deploy vciso-frontend --image gcr.io/$PROJECT_ID/vciso-frontend --region us-central1 --platform managed --allow-unauthenticated
if ($LASTEXITCODE -ne 0) { 
    try { python .\backend\scripts\send_deployment_sms.py "ALERT: Cloud Run deployment FAILED during final Frontend deployment phase!" } catch {}
    Write-Error "Frontend deployment failed"
    exit $LASTEXITCODE 
}

Write-Host ""
Write-Host "========================================="
Write-Host "Deployment completed successfully!"
Write-Host "========================================="

# Trigger Success SMS Alert
try {
    python .\backend\scripts\send_deployment_sms.py "vCISO Production deployment completed successfully! All frontend and backend services are active."
} catch {
    Write-Host "Warning: Failed to transmit success SMS."
}
