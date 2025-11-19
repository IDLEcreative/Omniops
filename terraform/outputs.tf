# Terraform Outputs - Values to export after apply

# VPC and Networking
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "nat_gateway_ips" {
  description = "Public IPs of NAT Gateways"
  value       = module.vpc.nat_public_ips
}

# Security Groups
output "app_security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.app.id
}

output "redis_security_group_id" {
  description = "ID of the Redis security group"
  value       = aws_security_group.redis.id
}

# S3 Buckets
output "assets_bucket" {
  description = "Name of the assets S3 bucket"
  value       = aws_s3_bucket.assets.id
}

output "assets_bucket_arn" {
  description = "ARN of the assets S3 bucket"
  value       = aws_s3_bucket.assets.arn
}

output "backups_bucket" {
  description = "Name of the backups S3 bucket"
  value       = aws_s3_bucket.backups.id
}

output "backups_bucket_arn" {
  description = "ARN of the backups S3 bucket"
  value       = aws_s3_bucket.backups.arn
}

# CloudFront
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.cdn.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "Hosted zone ID for the CloudFront distribution"
  value       = aws_cloudfront_distribution.cdn.hosted_zone_id
}

# Redis/ElastiCache
output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
  sensitive   = false
}

output "redis_port" {
  description = "Redis port"
  value       = 6379
}

output "redis_connection_string" {
  description = "Full Redis connection string"
  value       = "redis://default:${random_password.redis_auth.result}@${aws_elasticache_replication_group.redis.configuration_endpoint_address}:6379"
  sensitive   = true
}

# Secrets Manager
output "secrets_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "secrets_name" {
  description = "Name of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_secrets.name
}

# IAM Roles
output "app_role_arn" {
  description = "ARN of the application IAM role"
  value       = aws_iam_role.app_role.arn
}

output "app_role_name" {
  description = "Name of the application IAM role"
  value       = aws_iam_role.app_role.name
}

# CloudWatch
output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app.name
}

output "log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app.arn
}

# SNS
output "alerts_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

# Vercel
output "vercel_project_id" {
  description = "ID of the Vercel project"
  value       = vercel_project.app.id
}

output "vercel_project_name" {
  description = "Name of the Vercel project"
  value       = vercel_project.app.name
}

output "vercel_domain" {
  description = "Domain configured in Vercel"
  value       = vercel_project_domain.app.domain
}

# Account Information
output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "AWS Region"
  value       = var.aws_region
}

# Environment
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "deployed_at" {
  description = "Timestamp of deployment"
  value       = timestamp()
}

# URLs and Endpoints
output "application_url" {
  description = "Main application URL"
  value       = var.environment == "production" ? "https://omniops.co.uk" : "https://${var.environment}.omniops.co.uk"
}

output "api_endpoint" {
  description = "API endpoint URL"
  value       = var.environment == "production" ? "https://api.omniops.co.uk" : "https://api-${var.environment}.omniops.co.uk"
}

output "health_check_url" {
  description = "Health check endpoint URL"
  value       = "${var.environment == "production" ? "https://omniops.co.uk" : "https://${var.environment}.omniops.co.uk"}${var.health_check_path}"
}

# Connection Instructions
output "connection_instructions" {
  description = "Instructions for connecting to the infrastructure"
  value = <<EOF
=== Omniops Infrastructure Deployment Complete ===

Environment: ${var.environment}
Region: ${var.aws_region}
Account: ${data.aws_caller_identity.current.account_id}

Application URL: ${var.environment == "production" ? "https://omniops.co.uk" : "https://${var.environment}.omniops.co.uk"}
API Endpoint: ${var.environment == "production" ? "https://api.omniops.co.uk" : "https://api-${var.environment}.omniops.co.uk"}
Health Check: ${var.environment == "production" ? "https://omniops.co.uk" : "https://${var.environment}.omniops.co.uk"}${var.health_check_path}

CloudFront Distribution: ${aws_cloudfront_distribution.cdn.domain_name}
Redis Endpoint: ${aws_elasticache_replication_group.redis.configuration_endpoint_address}:6379

To access secrets:
aws secretsmanager get-secret-value --secret-id ${aws_secretsmanager_secret.app_secrets.name} --region ${var.aws_region}

To view logs:
aws logs tail ${aws_cloudwatch_log_group.app.name} --follow --region ${var.aws_region}

Vercel Project: ${vercel_project.app.name}
Vercel Domain: ${vercel_project_domain.app.domain}

Next Steps:
1. Update DNS records to point to CloudFront or Vercel
2. Configure Supabase project (manual step)
3. Run database migrations
4. Verify health check endpoint
5. Configure monitoring dashboards

EOF
}

# Sensitive Outputs (use terraform output -json to see)
output "sensitive_values" {
  description = "Sensitive configuration values (hidden by default)"
  value = {
    redis_auth_token = random_password.redis_auth.result
    encryption_key   = random_password.encryption_key.result
  }
  sensitive = true
}