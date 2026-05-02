# ============================================================
# CoffeeShop — Terraform Outputs (DigitalOcean)
# ============================================================

output "master_public_ip" {
  description = "Public IP of the K3s master node"
  value       = digitalocean_droplet.k3s_master.ipv4_address
}

output "worker_1_public_ip" {
  description = "Public IP of K3s worker node 1"
  value       = digitalocean_droplet.k3s_worker_1.ipv4_address
}

output "worker_2_public_ip" {
  description = "Public IP of K3s worker node 2"
  value       = digitalocean_droplet.k3s_worker_2.ipv4_address
}

output "master_private_ip" {
  description = "Private IP of the K3s master node (VPC)"
  value       = digitalocean_droplet.k3s_master.ipv4_address_private
}

output "vpc_id" {
  description = "ID of the created VPC"
  value       = digitalocean_vpc.k3s_vpc.id
}

output "ssh_command_master" {
  description = "SSH command to connect to master node"
  value       = "ssh root@${digitalocean_droplet.k3s_master.ipv4_address}"
}

output "ssh_command_worker_1" {
  description = "SSH command to connect to worker 1"
  value       = "ssh root@${digitalocean_droplet.k3s_worker_1.ipv4_address}"
}

output "ssh_command_worker_2" {
  description = "SSH command to connect to worker 2"
  value       = "ssh root@${digitalocean_droplet.k3s_worker_2.ipv4_address}"
}

output "kubeconfig_fetch_command" {
  description = "Command to fetch kubeconfig from master"
  value       = "scp root@${digitalocean_droplet.k3s_master.ipv4_address}:/etc/rancher/k3s/k3s.yaml ./kubeconfig.yaml"
}

output "ansible_inventory" {
  description = "Auto-generated Ansible inventory content"
  value       = <<-EOT
    [master]
    ${digitalocean_droplet.k3s_master.ipv4_address} ansible_user=root

    [workers]
    ${digitalocean_droplet.k3s_worker_1.ipv4_address} ansible_user=root
    ${digitalocean_droplet.k3s_worker_2.ipv4_address} ansible_user=root

    [k3s_cluster:children]
    master
    workers
  EOT
}
