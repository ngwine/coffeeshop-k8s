# ============================================================
# CoffeeShop — Terraform Variables (DigitalOcean)
# ============================================================

# ── DigitalOcean Authentication ──────────────────────────────
variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

# ── SSH Access ────────────────────────────────────────────────
variable "ssh_key_name" {
  description = "Name of the SSH key registered in DigitalOcean"
  type        = string
  default     = "coffeeshop-deploy"
}

variable "ssh_public_key" {
  description = "Public SSH key content for VM access"
  type        = string
}

# ── Project ───────────────────────────────────────────────────
variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "coffeeshop"
}

# ── Region ────────────────────────────────────────────────────
variable "region" {
  description = "DigitalOcean region (e.g., sgp1 for Singapore)"
  type        = string
  default     = "sgp1"
}

# ── Compute: Droplet Size ─────────────────────────────────────
variable "droplet_size" {
  description = "Droplet size slug (e.g., s-2vcpu-4gb)"
  type        = string
  default     = "s-2vcpu-4gb"
}

# ── Networking ────────────────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.10.10.0/24"
}

# ── Domain ────────────────────────────────────────────────────
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "coffeeshopk8s.me"
}
