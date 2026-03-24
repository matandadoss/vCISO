$ErrorActionPreference = "Continue"

$PROJECT_ID = gcloud config get-value project
Write-Host "Setting up IAM for project: $PROJECT_ID"

# 1. Create Backend Service Account
Write-Host "Creating vciso-backend-sa..."
gcloud iam service-accounts create vciso-backend-sa --display-name="vCISO Backend Identity"

$BACKEND_SA = "vciso-backend-sa@$PROJECT_ID.iam.gserviceaccount.com"

Write-Host "Binding roles to vciso-backend-sa..."
$backendRoles = @(
    "roles/cloudsql.client",
    "roles/aiplatform.user",
    "roles/secretmanager.secretAccessor",
    "roles/cloudtrace.agent",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter"
)

foreach ($role in $backendRoles) {
    gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$BACKEND_SA" --role="$role" --condition=None
}

# 2. Create Frontend Service Account
Write-Host "Creating vciso-frontend-sa..."
gcloud iam service-accounts create vciso-frontend-sa --display-name="vCISO Frontend Identity"

$FRONTEND_SA = "vciso-frontend-sa@$PROJECT_ID.iam.gserviceaccount.com"

Write-Host "Binding roles to vciso-frontend-sa..."
$frontendRoles = @(
    "roles/cloudtrace.agent",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/secretmanager.secretAccessor"
)

foreach ($role in $frontendRoles) {
    gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$FRONTEND_SA" --role="$role" --condition=None
}

Write-Host "IAM Provisioning Complete!"
