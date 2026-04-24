# ============================================================
# CoffeeShop — Terraform Variables
# ============================================================

# ── OCI Authentication ────────────────────────────────────────
variable "tenancy_ocid" {
  description = "OCID of the OCI tenancy"
  type        = string
}

variable "user_ocid" {
  description = "OCID of the OCI user"
  type        = string
}

variable "fingerprint" {
  description = "Fingerprint of the API signing key"
  type        = string
}

variable "private_key_path" {
  description = "Path to the OCI API private key file"
  type        = string
  default     = "~/.oci/oci_api_key.pem"
}

variable "region" {
  description = "OCI region (e.g., ap-singapore-1)"
  type        = string
  default     = "ap-singapore-1"
}

variable "compartment_ocid" {
  description = "OCID of the compartment to deploy into"
  type        = string
}

# ── SSH Access ────────────────────────────────────────────────
variable "ssh_public_key" {
  description = "Public SSH key for VM access"
  type        = string
}

# ── Project ───────────────────────────────────────────────────
variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "coffeeshop"
}

# ── Networking ────────────────────────────────────────────────
variable "vcn_cidr_block" {
  description = "CIDR block for the VCN"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

# ── Compute: Master Node ─────────────────────────────────────
variable "master_ocpus" {
  description = "Number of OCPUs for master node"
  type        = number
  default     = 1
}

variable "master_memory" {
  description = "Memory in GB for master node"
  type        = number
  default     = 6
}

# ── Compute: Worker Nodes ────────────────────────────────────
variable "worker_ocpus" {
  description = "Number of OCPUs per worker node"
  type        = number
  default     = 1.5
}

variable "worker_memory" {
  description = "Memory in GB per worker node"
  type        = number
  default     = 9
}

# ── Domain ────────────────────────────────────────────────────
variable "domain_name" {
  description = "Domain name for the application (e.g., coffeeshop.xyz)"
  type        = string
  default     = "coffeeshop.xyz"
}
