$ErrorActionPreference = "Stop"

$PROJECT_ID = "gen-lang-client-0873796692"
$REGION = "us-central1"
$KEYRING_NAME = "vciso-keyring"
$KEY_NAME = "vciso-cmek"

Write-Host "1. Enabling Cloud KMS API..." -ForegroundColor Cyan
gcloud services enable cloudkms.googleapis.com --project=$PROJECT_ID

Write-Host "2. Creating KMS KeyRing ($KEYRING_NAME)..." -ForegroundColor Cyan
# Try creating keyring, continue if it already exists
try {
    gcloud kms keyrings create $KEYRING_NAME --location=$REGION --project=$PROJECT_ID 2>$null
    Write-Host "  -> KeyRing created." -ForegroundColor Green
} catch {
    Write-Host "  -> KeyRing already exists (or creation failed, verifying...)" -ForegroundColor Yellow
}

Write-Host "3. Creating KMS CryptoKey ($KEY_NAME)..." -ForegroundColor Cyan
try {
    gcloud kms keys create $KEY_NAME --keyring=$KEYRING_NAME --location=$REGION --purpose="encryption" --project=$PROJECT_ID 2>$null
    Write-Host "  -> CryptoKey created." -ForegroundColor Green
} catch {
    Write-Host "  -> CryptoKey already exists (or creation failed, verifying...)" -ForegroundColor Yellow
}

Write-Host "4. Retrieving Service Agents..." -ForegroundColor Cyan
$SQL_SA = (gcloud sql instances describe ciso-postgres --project=$PROJECT_ID --format="value(serviceAccountEmailAddress)")
$GCS_SA = (gcloud storage service-agent --project=$PROJECT_ID)

Write-Host "  -> Cloud SQL Agent: $SQL_SA"
Write-Host "  -> Cloud Storage Agent: $GCS_SA"

Write-Host "5. Binding IAM roles/cloudkms.cryptoKeyEncrypterDecrypter..." -ForegroundColor Cyan
gcloud kms keys add-iam-policy-binding $KEY_NAME `
    --keyring=$KEYRING_NAME `
    --location=$REGION `
    --member="serviceAccount:$SQL_SA" `
    --role="roles/cloudkms.cryptoKeyEncrypterDecrypter" `
    --project=$PROJECT_ID

gcloud kms keys add-iam-policy-binding $KEY_NAME `
    --keyring=$KEYRING_NAME `
    --location=$REGION `
    --member="serviceAccount:$GCS_SA" `
    --role="roles/cloudkms.cryptoKeyEncrypterDecrypter" `
    --project=$PROJECT_ID

Write-Host "CMEK Setup Complete!" -ForegroundColor Green
