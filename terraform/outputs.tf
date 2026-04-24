# ============================================================
# CoffeeShop — Terraform Outputs
# ============================================================

output "master_public_ip" {
  description = "Public IP of the K3s master node"
  value       = oci_core_instance.k3s_master.public_ip
}

output "worker_1_public_ip" {
  description = "Public IP of K3s worker node 1"
  value       = oci_core_instance.k3s_worker_1.public_ip
}

output "worker_2_public_ip" {
  description = "Public IP of K3s worker node 2"
  value       = oci_core_instance.k3s_worker_2.public_ip
}

output "master_private_ip" {
  description = "Private IP of the K3s master node"
  value       = oci_core_instance.k3s_master.private_ip
}

output "vcn_id" {
  description = "OCID of the created VCN"
  value       = module.networking.vcn_id
}

output "subnet_id" {
  description = "OCID of the public subnet"
  value       = module.networking.public_subnet_id
}

output "ssh_command_master" {
  description = "SSH command to connect to master node"
  value       = "ssh opc@${oci_core_instance.k3s_master.public_ip}"
}

output "ssh_command_worker_1" {
  description = "SSH command to connect to worker 1"
  value       = "ssh opc@${oci_core_instance.k3s_worker_1.public_ip}"
}

output "ssh_command_worker_2" {
  description = "SSH command to connect to worker 2"
  value       = "ssh opc@${oci_core_instance.k3s_worker_2.public_ip}"
}

output "kubeconfig_fetch_command" {
  description = "Command to fetch kubeconfig from master"
  value       = "scp opc@${oci_core_instance.k3s_master.public_ip}:/etc/rancher/k3s/k3s.yaml ./kubeconfig.yaml"
}

output "ansible_inventory" {
  description = "Auto-generated Ansible inventory content"
  value       = <<-EOT
    [master]
    ${oci_core_instance.k3s_master.public_ip} ansible_user=opc

    [workers]
    ${oci_core_instance.k3s_worker_1.public_ip} ansible_user=opc
    ${oci_core_instance.k3s_worker_2.public_ip} ansible_user=opc

    [k3s_cluster:children]
    master
    workers
  EOT
}
