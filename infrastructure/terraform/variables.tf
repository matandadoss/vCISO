variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources in"
  type        = string
  default     = "us-central1"
}

variable "db_password" {
  description = "Password for the Cloud SQL database user"
  type        = string
  sensitive   = true
}
