terraform {
  required_version = ">= 1.8.0"
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.48.0"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

module "core" {
  source       = "./modules/core"
  ssh_key_name = var.ssh_key_name
}

module "judge" {
  source       = "./modules/judge"
  judge_count  = var.judge_count
  ssh_key_name = var.ssh_key_name
}
