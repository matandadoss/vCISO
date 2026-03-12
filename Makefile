.PHONY: dev-up dev-down backend-start frontend-start migrate test deploy-staging deploy-prod terraform-plan terraform-apply

dev-up:
	docker-compose up -d

dev-down:
	docker-compose down

backend-start:
	cd backend && uvicorn app.main:app --reload

frontend-start:
	cd frontend && npm run dev

migrate:
	cd backend && alembic upgrade head

test:
	cd backend && pytest
	cd frontend && npm test

deploy-staging:
	gcloud builds submit --config infrastructure/cloudbuild/cloudbuild.yaml --substitutions=_ENV=staging

deploy-prod:
	gcloud builds submit --config infrastructure/cloudbuild/cloudbuild.yaml --substitutions=_ENV=prod

terraform-plan:
	cd infrastructure/terraform && terraform plan

terraform-apply:
	cd infrastructure/terraform && terraform apply
