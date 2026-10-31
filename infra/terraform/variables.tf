variable "hcloud_token" {
  type        = string
  description = "Hetzner Cloud API Token"
  sensitive   = true
  default     = "fake_token_for_validation_only"
}

variable "ssh_key_name" {
  type        = string
  description = "SSH key authorized for provisioning"
  default     = "dagna-deploy-key"
}

variable "judge_count" {
  type        = number
  description = "Number of active judge VPS instances (scales linearly)"
  default     = 1
}
