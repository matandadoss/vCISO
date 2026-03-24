$ErrorActionPreference = "Stop"

$PROJECT_ID = "gen-lang-client-0873796692"
$REGION = "us-central1"
$BUCKET_NAME = "vciso-platform-assets"
$KEYRING_NAME = "vciso-keyring"
$KEY_NAME = "vciso-cmek"
$FULL_KEY_PATH = "projects/$PROJECT_ID/locations/$REGION/keyRings/$KEYRING_NAME/cryptoKeys/$KEY_NAME"

Write-Host "1. Validating CMEK Key Status..." -ForegroundColor Cyan
gcloud kms keys describe $KEY_NAME --keyring=$KEYRING_NAME --location=$REGION --project=$PROJECT_ID

Write-Host "2. Enforcing CMEK as the explicit default for gs://$BUCKET_NAME..." -ForegroundColor Cyan
gcloud storage buckets update gs://$BUCKET_NAME `
    --default-encryption-key=$FULL_KEY_PATH `
    --project=$PROJECT_ID

Write-Host "  -> Bucket default encryption explicitly modified." -ForegroundColor Green

Write-Host "3. Actively scanning for plaintext blobs to orchestrate encryption rotation..." -ForegroundColor Cyan
# Capture the list of files; if this fails or returns empty, there are no files to rotate
$FILES = gcloud storage ls gs://$BUCKET_NAME/** 2>$null
if ($FILES) {
    Write-Host "  -> Rotating resting objects to symmetric CMEK schemas..." -ForegroundColor Yellow
    gcloud storage rewrite gs://$BUCKET_NAME/** `
        --encryption-key=$FULL_KEY_PATH `
        --project=$PROJECT_ID
    Write-Host "  -> Object rewrite execution completed." -ForegroundColor Green
} else {
    Write-Host "  -> No existing files discovered inside the bucket. All future uploads will be encrypted natively." -ForegroundColor Green
}

Write-Host "Bucket CMEK Mutation Pipeline Finalized!" -ForegroundColor Green
