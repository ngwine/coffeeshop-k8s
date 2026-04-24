# ============================================================
# CoffeeShop — Networking Module
# VCN, Subnet, Internet Gateway, Security Lists
# ============================================================

variable "compartment_ocid" {
  type = string
}

variable "vcn_cidr_block" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type    = string
  default = "10.0.1.0/24"
}

variable "project_name" {
  type    = string
  default = "coffeeshop"
}

variable "availability_domain" {
  type = string
}

# ── Virtual Cloud Network ────────────────────────────────────
resource "oci_core_vcn" "main" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = [var.vcn_cidr_block]
  display_name   = "${var.project_name}-vcn"
  dns_label      = var.project_name

  freeform_tags = {
    Project   = var.project_name
    ManagedBy = "terraform"
  }
}

# ── Internet Gateway ─────────────────────────────────────────
resource "oci_core_internet_gateway" "main" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.project_name}-igw"
  enabled        = true
}

# ── Route Table ───────────────────────────────────────────────
resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.project_name}-public-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.main.id
  }
}

# ── Security List (Firewall Rules) ───────────────────────────
resource "oci_core_security_list" "k3s" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.project_name}-k3s-seclist"

  # ── Egress: Allow all outbound ───────────────────────────
  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
    stateless   = false
  }

  # ── Ingress: SSH ─────────────────────────────────────────
  ingress_security_rules {
    protocol  = "6"  # TCP
    source    = "0.0.0.0/0"
    stateless = false
    tcp_options {
      min = 22
      max = 22
    }
  }

  # ── Ingress: HTTP ────────────────────────────────────────
  ingress_security_rules {
    protocol  = "6"
    source    = "0.0.0.0/0"
    stateless = false
    tcp_options {
      min = 80
      max = 80
    }
  }

  # ── Ingress: HTTPS ───────────────────────────────────────
  ingress_security_rules {
    protocol  = "6"
    source    = "0.0.0.0/0"
    stateless = false
    tcp_options {
      min = 443
      max = 443
    }
  }

  # ── Ingress: K8s API Server ──────────────────────────────
  ingress_security_rules {
    protocol  = "6"
    source    = "0.0.0.0/0"
    stateless = false
    tcp_options {
      min = 6443
      max = 6443
    }
  }

  # ── Ingress: Kubelet API ─────────────────────────────────
  ingress_security_rules {
    protocol  = "6"
    source    = var.vcn_cidr_block
    stateless = false
    tcp_options {
      min = 10250
      max = 10250
    }
  }

  # ── Ingress: NodePort range ──────────────────────────────
  ingress_security_rules {
    protocol  = "6"
    source    = "0.0.0.0/0"
    stateless = false
    tcp_options {
      min = 30000
      max = 32767
    }
  }

  # ── Ingress: VXLAN (Flannel) ─────────────────────────────
  ingress_security_rules {
    protocol  = "17"  # UDP
    source    = var.vcn_cidr_block
    stateless = false
    udp_options {
      min = 8472
      max = 8472
    }
  }

  # ── Ingress: WireGuard ───────────────────────────────────
  ingress_security_rules {
    protocol  = "17"
    source    = var.vcn_cidr_block
    stateless = false
    udp_options {
      min = 51820
      max = 51820
    }
  }

  # ── Ingress: Grafana (if exposed externally) ─────────────
  ingress_security_rules {
    protocol  = "6"
    source    = "0.0.0.0/0"
    stateless = false
    tcp_options {
      min = 3000
      max = 3000
    }
  }

  # ── Ingress: ICMP (ping) ────────────────────────────────
  ingress_security_rules {
    protocol  = "1"  # ICMP
    source    = "0.0.0.0/0"
    stateless = false
  }
}

# ── Public Subnet ─────────────────────────────────────────────
resource "oci_core_subnet" "public" {
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_vcn.main.id
  cidr_block        = var.public_subnet_cidr
  display_name      = "${var.project_name}-public-subnet"
  dns_label         = "pub"
  route_table_id    = oci_core_route_table.public.id
  security_list_ids = [oci_core_security_list.k3s.id]

  freeform_tags = {
    Project   = var.project_name
    ManagedBy = "terraform"
  }
}

# ── Outputs ───────────────────────────────────────────────────
output "vcn_id" {
  value = oci_core_vcn.main.id
}

output "public_subnet_id" {
  value = oci_core_subnet.public.id
}

output "security_list_id" {
  value = oci_core_security_list.k3s.id
}
