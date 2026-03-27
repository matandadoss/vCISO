$ErrorActionPreference = "Continue"

Write-Host "========================================="
Write-Host "vCISO Unattended Production Deployment (Parallel)"
Write-Host "========================================="
Write-Host ""

$workDir = $PWD.Path

# Trigger Deployment Start SMS Alert
try {
    python .\backend\scripts\send_deployment_sms.py "vCISO Cloud Run deployment has started (Parallel Mode)..."
} catch {
    Write-Host "Warning: Failed to transmit start SMS."
}

$PROJECT_ID = gcloud config get-value project
Write-Host "Using Project ID: $PROJECT_ID"
Write-Host ""
Write-Host "Starting simultaneous Backend and Frontend builds..."

# Define Backend Job
$backendScript = {
    param($PROJECT_ID, $WORK_DIR)
    Set-Location -Path $WORK_DIR
    $ErrorActionPreference = "Continue"
    gcloud builds submit --tag gcr.io/$PROJECT_ID/vciso-backend --machine-type=e2-highcpu-8 .\backend 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Backend Build Failed" }
    gcloud run deploy vciso-backend --image gcr.io/$PROJECT_ID/vciso-backend --region us-central1 --platform managed --allow-unauthenticated --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID --service-account="vciso-backend-sa@$($PROJECT_ID).iam.gserviceaccount.com" --add-cloudsql-instances="$($PROJECT_ID):us-central1:ciso-postgres" 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Backend Deploy Failed" }
    return "Backend Deployment Complete"
}

# Define Frontend Job
$frontendScript = {
    param($PROJECT_ID, $WORK_DIR)
    Set-Location -Path $WORK_DIR
    $ErrorActionPreference = "Continue"
    gcloud builds submit --tag gcr.io/$PROJECT_ID/vciso-frontend --machine-type=e2-highcpu-8 .\frontend 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Frontend Build Failed" }
    gcloud run deploy vciso-frontend --image gcr.io/$PROJECT_ID/vciso-frontend --region us-central1 --platform managed --allow-unauthenticated --service-account="vciso-frontend-sa@$PROJECT_ID.iam.gserviceaccount.com" 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Frontend Deploy Failed" }
    return "Frontend Deployment Complete"
}

# Start Jobs
$backendJob = Start-Job -ScriptBlock $backendScript -ArgumentList $PROJECT_ID, $workDir
$frontendJob = Start-Job -ScriptBlock $frontendScript -ArgumentList $PROJECT_ID, $workDir

Write-Host "Waiting for background jobs to complete (This typically takes 3-5 minutes)..."
Write-Host "NOTE: Real-time Cloud Build logs are hidden during parallel execution. Check your GCP console if you wish to view live activity."
Write-Host "Processing.............."

# Wait for both jobs to finish
Wait-Job -Job $backendJob, $frontendJob | Out-Null

# Output results
Write-Host "========================================="
Write-Host "Backend Job Output:"
Receive-Job -Job $backendJob

Write-Host "========================================="
Write-Host "Frontend Job Output:"
Receive-Job -Job $frontendJob

# Check states
if ($backendJob.State -ne 'Completed' -or $frontendJob.State -ne 'Completed') {
    try { python .\backend\scripts\send_deployment_sms.py "ALERT: Production deployment FAILED during parallel execution. Check logs immediately." } catch {}
    Write-Error "Deployment Failed. One or more background jobs failed."
    exit 1
}

Write-Host ""
Write-Host "========================================="
Write-Host "Deployment completed successfully!"
Write-Host "========================================="

# Trigger Success SMS Alert
try {
    python .\backend\scripts\send_deployment_sms.py "vCISO Production deployment completed successfully! All parallel processes finished."
} catch {
    Write-Host "Warning: Failed to transmit success SMS."
}
