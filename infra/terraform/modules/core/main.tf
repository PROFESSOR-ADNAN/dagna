terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.48.0"
    }
  }
}

variable "server_type" {
  type    = string
  default = "cx22" # 2 vCPU, 4 GB RAM (~€3.79/month)
}

variable "location" {
  type    = string
  default = "fsn1" # Falkenstein, Germany
}

variable "ssh_key_name" {
  type = string
}

resource "hcloud_server" "core_host" {
  name        = "dagna-core"
  image       = "ubuntu-24.04"
  server_type = var.server_type
  location    = var.location
  ssh_keys    = [var.ssh_key_name]

  firewall_ids = [hcloud_firewall.core_fw.id]

  labels = {
    role = "core"
  }
}

resource "hcloud_firewall" "core_fw" {
  name = "dagna-core-firewall"

  # Public HTTPS
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  # Public HTTP (for ACME challenge / redirect)
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  # WireGuard UDP tunnel port
  rule {
    direction  = "in"
    protocol   = "udp"
    port       = "51820"
    source_ips = ["0.0.0.0/0"]
  }
}

output "ipv4_address" {
  value = hcloud_server.core_host.ipv4_address
}
