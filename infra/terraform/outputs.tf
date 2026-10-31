output "core_public_ip" {
  value       = module.core.ipv4_address
  description = "Public IP address of Dagna Core Host (Reverse Proxy & API)"
}

output "judge_public_ips" {
  value       = module.judge.judge_ips
  description = "Public IP addresses of Judge Hosts (zero open inbound ports)"
}
