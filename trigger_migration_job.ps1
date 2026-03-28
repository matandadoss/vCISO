$jobName = "migrate-org-profile"
# Get the current project ID and build the image tag dynamically
$PROJECT_ID = gcloud config get-value project
$image = "gcr.io/$PROJECT_ID/vciso-backend"

Write-Host "Using latest uploaded container image..."

Write-Host "Creating/Updating Cloud Run Job for Migration..."
gcloud run jobs create $jobName --image $image --region us-central1 --command "python" --args "scripts/add_org_profile_fields.py" --set-cloudsql-instances "$PROJECT_ID:us-central1:ciso-postgres" --service-account="vciso-backend-sa@$PROJECT_ID.iam.gserviceaccount.com" --set-env-vars ENV=production
if ($LASTEXITCODE -ne 0) {
    gcloud run jobs update $jobName --image $image --region us-central1 --command "python" --args "scripts/add_org_profile_fields.py" --set-cloudsql-instances "$PROJECT_ID:us-central1:ciso-postgres" --service-account="vciso-backend-sa@$PROJECT_ID.iam.gserviceaccount.com" --set-env-vars ENV=production
}

Write-Host "Executing Migration Job..."
gcloud run jobs execute $jobName --region us-central1 --wait
