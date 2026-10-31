terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.48.0"
    }
  }
}

variable "judge_count" {
  type    = number
  default = 1
}

variable "server_type" {
  type    = string
  default = "cpx31" # 4 vCPU, 8 GB RAM (~$15.50/month)
}

variable "location" {
  type    = string
  default = "fsn1"
}

variable "ssh_key_name" {
  type = string
}

resource "hcloud_server" "judge_host" {
  count       = var.judge_count
  name        = "dagna-judge-${count.index + 1}"
  image       = "ubuntu-24.04"
  server_type = var.server_type
  location    = var.location
  ssh_keys    = [var.ssh_key_name]

  firewall_ids = [hcloud_firewall.judge_fw.id]

  labels = {
    role  = "judge"
    index = "${count.index + 1}"
  }
}

resource "hcloud_firewall" "judge_fw" {
  name = "dagna-judge-firewall"

  # STRICT SECURITY: ZERO public inbound ports
  # All ingress must occur via WireGuard internal interface exclusively
}

output "judge_ips" {
  value = hcloud_server.judge_host[*].ipv4_address
}
