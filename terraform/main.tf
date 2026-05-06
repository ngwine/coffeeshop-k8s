# ============================================================
# CoffeeShop — Terraform Main Configuration (DigitalOcean)
# Infrastructure as Code (IaC) — Cloud VM Provisioning
# Provisions: 1x Single-Node K3s + VPC + Firewall
# ============================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.30"
    }
  }
}

# ── Provider ──────────────────────────────────────────────────
provider "digitalocean" {
  token = var.do_token
}

# ── Data Sources ──────────────────────────────────────────────
# Lookup SSH key already registered in DigitalOcean
data "digitalocean_ssh_key" "deploy" {
  name = var.ssh_key_name
}

# ── VPC (Private Network) ────────────────────────────────────
# Reference existing VPC (provisioned during initial setup)
data "digitalocean_vpc" "k3s_vpc" {
  name = "default-sgp1"
}

# ── K3s Master Node ───────────────────────────────────────────
resource "digitalocean_droplet" "k3s_master" {
  name     = "${var.project_name}-k3s-master"
  region   = var.region
  size     = var.droplet_size
  image    = "ubuntu-24-04-x64"
  vpc_uuid = data.digitalocean_vpc.k3s_vpc.id

  ssh_keys = [data.digitalocean_ssh_key.deploy.id]

  tags = [
    var.project_name,
    "k3s-master",
    "production"
  ]

  # Cloud-init: open firewall ports for K3s
  user_data = <<-EOF
    #!/bin/bash
    echo "K3s Master node initialized" > /tmp/init.log
    # UFW rules for K3s
    ufw allow 6443/tcp   # K8s API
    ufw allow 10250/tcp  # Kubelet
    ufw allow 80/tcp     # HTTP
    ufw allow 443/tcp    # HTTPS
    ufw allow 8472/udp   # VXLAN (Flannel)
    ufw allow 51820/udp  # WireGuard
    ufw allow 30000:32767/tcp  # NodePort
    ufw reload
  EOF

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [user_data, ssh_keys, image, public_networking, vpc_uuid]
  }
}



# ── Firewall ──────────────────────────────────────────────────
# DigitalOcean Cloud Firewall (applied to all K3s nodes)
resource "digitalocean_firewall" "k3s_firewall" {
  name = "${var.project_name}-k3s-firewall"

  droplet_ids = [
    digitalocean_droplet.k3s_master.id,
  ]

  # ── Inbound Rules ──

  # SSH
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTP
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # K8s API Server
  inbound_rule {
    protocol         = "tcp"
    port_range       = "6443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Kubelet
  inbound_rule {
    protocol         = "tcp"
    port_range       = "10250"
    source_addresses = [var.vpc_cidr]
  }

  # VXLAN (Flannel overlay network)
  inbound_rule {
    protocol         = "udp"
    port_range       = "8472"
    source_addresses = [var.vpc_cidr]
  }

  # WireGuard
  inbound_rule {
    protocol         = "udp"
    port_range       = "51820"
    source_addresses = [var.vpc_cidr]
  }

  # NodePort range
  inbound_rule {
    protocol         = "tcp"
    port_range       = "30000-32767"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Grafana (monitoring)
  inbound_rule {
    protocol         = "tcp"
    port_range       = "3000"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # ── Outbound Rules (allow all) ──
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

# ── DigitalOcean Project ──────────────────────────────────────
# Group all resources under a project in DO dashboard
resource "digitalocean_project" "coffeeshop" {
  name        = var.project_name
  description = "CoffeeShop K3s Production Cluster"
  purpose     = "Service or API"
  environment = "Production"
  is_default  = true

  resources = [
    digitalocean_droplet.k3s_master.urn,
  ]
}
