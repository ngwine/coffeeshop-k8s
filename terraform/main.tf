# ============================================================
# CoffeeShop — Terraform Main Configuration
# Oracle Cloud Infrastructure (OCI) — Always Free Tier
# Provisions: 3x ARM Ampere A1 VMs + VCN + K3s-ready networking
# ============================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }

  # Remote state storage (optional, recommended for teams)
  # backend "s3" {
  #   bucket   = "coffeeshop-tfstate"
  #   key      = "terraform.tfstate"
  #   region   = "ap-singapore-1"
  #   endpoint = "https://<namespace>.compat.objectstorage.<region>.oraclecloud.com"
  # }
}

# ── Provider ──────────────────────────────────────────────────
provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# ── Data Sources ──────────────────────────────────────────────
# Fetch the latest Oracle Linux 9 ARM image (Always Free eligible)
data "oci_core_images" "oracle_linux_arm" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Oracle Linux"
  operating_system_version = "9"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# Availability Domain
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

# ── Networking Module ─────────────────────────────────────────
module "networking" {
  source = "./modules/networking"

  compartment_ocid    = var.compartment_ocid
  vcn_cidr_block      = var.vcn_cidr_block
  public_subnet_cidr  = var.public_subnet_cidr
  project_name        = var.project_name
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
}

# ── K3s Master Node ───────────────────────────────────────────
resource "oci_core_instance" "k3s_master" {
  compartment_id      = var.compartment_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = "${var.project_name}-k3s-master"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = var.master_ocpus   # 1 OCPU
    memory_in_gbs = var.master_memory  # 6 GB
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.oracle_linux_arm.images[0].id
    boot_volume_size_in_gbs = 50
  }

  create_vnic_details {
    subnet_id        = module.networking.public_subnet_id
    assign_public_ip = true
    display_name     = "${var.project_name}-master-vnic"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data = base64encode(<<-EOF
      #!/bin/bash
      echo "K3s Master node initialized" > /tmp/init.log
      # Firewall rules for K3s
      sudo firewall-cmd --permanent --add-port=6443/tcp   # K8s API
      sudo firewall-cmd --permanent --add-port=10250/tcp  # Kubelet
      sudo firewall-cmd --permanent --add-port=80/tcp     # HTTP
      sudo firewall-cmd --permanent --add-port=443/tcp    # HTTPS
      sudo firewall-cmd --permanent --add-port=8472/udp   # VXLAN (Flannel)
      sudo firewall-cmd --permanent --add-port=51820/udp  # WireGuard
      sudo firewall-cmd --reload
    EOF
    )
  }

  freeform_tags = {
    Environment = "production"
    Role        = "k3s-master"
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# ── K3s Worker Node 1 ─────────────────────────────────────────
resource "oci_core_instance" "k3s_worker_1" {
  compartment_id      = var.compartment_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = "${var.project_name}-k3s-worker-1"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = var.worker_ocpus   # 1.5 OCPU
    memory_in_gbs = var.worker_memory  # 9 GB
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.oracle_linux_arm.images[0].id
    boot_volume_size_in_gbs = 75
  }

  create_vnic_details {
    subnet_id        = module.networking.public_subnet_id
    assign_public_ip = true
    display_name     = "${var.project_name}-worker-1-vnic"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data = base64encode(<<-EOF
      #!/bin/bash
      echo "K3s Worker 1 initialized" > /tmp/init.log
      sudo firewall-cmd --permanent --add-port=10250/tcp
      sudo firewall-cmd --permanent --add-port=8472/udp
      sudo firewall-cmd --permanent --add-port=51820/udp
      sudo firewall-cmd --reload
    EOF
    )
  }

  freeform_tags = {
    Environment = "production"
    Role        = "k3s-worker"
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# ── K3s Worker Node 2 ─────────────────────────────────────────
resource "oci_core_instance" "k3s_worker_2" {
  compartment_id      = var.compartment_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = "${var.project_name}-k3s-worker-2"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = var.worker_ocpus   # 1.5 OCPU
    memory_in_gbs = var.worker_memory  # 9 GB
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.oracle_linux_arm.images[0].id
    boot_volume_size_in_gbs = 75
  }

  create_vnic_details {
    subnet_id        = module.networking.public_subnet_id
    assign_public_ip = true
    display_name     = "${var.project_name}-worker-2-vnic"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data = base64encode(<<-EOF
      #!/bin/bash
      echo "K3s Worker 2 initialized" > /tmp/init.log
      sudo firewall-cmd --permanent --add-port=10250/tcp
      sudo firewall-cmd --permanent --add-port=8472/udp
      sudo firewall-cmd --permanent --add-port=51820/udp
      sudo firewall-cmd --reload
    EOF
    )
  }

  freeform_tags = {
    Environment = "production"
    Role        = "k3s-worker"
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}
