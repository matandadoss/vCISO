$jobName = "seed-better-minds"
$image = "gcr.io/gen-lang-client-0873796692/vciso-backend"

gcloud run jobs create $jobName --image $image --region us-central1 --command "python" --args "scripts/seed_better_minds.py" --set-cloudsql-instances "gen-lang-client-0873796692:us-central1:ciso-postgres" --service-account="vciso-backend-sa@gen-lang-client-0873796692.iam.gserviceaccount.com" --set-env-vars ENV=production
if ($LASTEXITCODE -ne 0) {
    gcloud run jobs update $jobName --image $image --region us-central1 --command "python" --args "scripts/seed_better_minds.py" --set-cloudsql-instances "gen-lang-client-0873796692:us-central1:ciso-postgres" --service-account="vciso-backend-sa@gen-lang-client-0873796692.iam.gserviceaccount.com" --set-env-vars ENV=production
}

gcloud run jobs execute $jobName --region us-central1 --wait
