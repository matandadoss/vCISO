$jobName = "merge-consolidate-db"
$image = "gcr.io/gen-lang-client-0873796692/vciso-backend"

# Trigger a Cloud Build FIRST to get the new script into the container
Write-Host "Rebuilding backend container to package merge script..."
gcloud builds submit --tag $image --machine-type=e2-highcpu-8 .\backend
if ($LASTEXITCODE -ne 0) { throw "Backend Build Failed" }

Write-Host "Creating/Updating Cloud Run Job..."
gcloud run jobs create $jobName --image $image --region us-central1 --command "python" --args "scripts/merge_and_consolidate.py" --set-cloudsql-instances "gen-lang-client-0873796692:us-central1:ciso-postgres" --service-account="vciso-backend-sa@gen-lang-client-0873796692.iam.gserviceaccount.com" --set-env-vars ENV=production
if ($LASTEXITCODE -ne 0) {
    gcloud run jobs update $jobName --image $image --region us-central1 --command "python" --args "scripts/merge_and_consolidate.py" --set-cloudsql-instances "gen-lang-client-0873796692:us-central1:ciso-postgres" --service-account="vciso-backend-sa@gen-lang-client-0873796692.iam.gserviceaccount.com" --set-env-vars ENV=production
}

Write-Host "Executing Consolidation Job..."
gcloud run jobs execute $jobName --region us-central1 --wait
