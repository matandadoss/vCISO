terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# 1. Enable Required Services
resource "google_project_service" "services" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "pubsub.googleapis.com",
    "redis.googleapis.com",
    "secretmanager.googleapis.com",
    "aiplatform.googleapis.com",
    "cloudbuild.googleapis.com",
    "bigquery.googleapis.com"
  ])
  service            = each.key
  disable_on_destroy = false
}

# 2. Cloud SQL (PostgreSQL)
resource "google_sql_database_instance" "vciso_db" {
  name             = "vciso-db-instance"
  database_version = "POSTGRES_15"
  region           = var.region
  
  settings {
    tier = "db-f1-micro" # Minimal for demo. Use custom for prod.
    # Require SSL
    ip_configuration {
      require_ssl = true
    }
  }
  depends_on = [google_project_service.services]
}

resource "google_sql_database" "database" {
  name     = "vciso"
  instance = google_sql_database_instance.vciso_db.name
}

resource "google_sql_user" "users" {
  name     = "vciso-app-user"
  instance = google_sql_database_instance.vciso_db.name
  password = var.db_password
}

# 3. Memorystore (Redis)
resource "google_redis_instance" "cache" {
  name           = "vciso-cache"
  memory_size_gb = 1
  region         = var.region
  redis_version  = "REDIS_6_X"
  depends_on     = [google_project_service.services]
}

# 4. Pub/Sub Topics
resource "google_pubsub_topic" "topics" {
  for_each = toset([
    "scc-events-raw",
    "threat-intel-raw",
    "findings-events"
  ])
  name = each.key
  depends_on = [google_project_service.services]
}

# 5. BigQuery Dataset (for Analytics/Cost Tracking)
resource "google_bigquery_dataset" "analytics" {
  dataset_id                  = "vciso_analytics"
  friendly_name               = "vCISO Analytics"
  description                 = "Dataset for vCISO AI cost tracking and reporting."
  location                    = "US" # Example
  depends_on                  = [google_project_service.services]
}

# 6. Service Account for Cloud Run
resource "google_service_account" "cloudrun_sa" {
  account_id   = "vciso-cloudrun-sa"
  display_name = "vCISO Cloud Run Service Account"
}

# Minimal IAM roles - Workload Identity is preferred
resource "google_project_iam_member" "sa_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/pubsub.publisher",
    "roles/pubsub.subscriber",
    "roles/aiplatform.user",
    "roles/bigquery.dataEditor"
  ])
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# 7. Cloud Run Backend
resource "google_cloud_run_v2_service" "backend" {
  name     = "vciso-backend"
  location = var.region
  
  template {
    service_account = google_service_account.cloudrun_sa.email
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello" # Placeholder
      
      env {
        name  = "DATABASE_URL"
        value = "postgresql+asyncpg://vciso-app-user:${var.db_password}@/vciso?host=/cloudsql/${google_sql_database_instance.vciso_db.connection_name}"
      }
      env {
         name = "REDIS_URL"
         value = "redis://${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
      }
      env {
         name = "GCP_PROJECT"
         value = var.project_id
      }
      # Add Secrets (API keys, etc) mapped to Secret Manager
    }
  }
  depends_on = [google_project_service.services]
}

# Note: Cloud Run Frontend and Neo4j Aura provisioning omitted for brevity.
