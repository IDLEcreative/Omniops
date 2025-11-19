# Variable Definitions for Omniops Infrastructure

# Environment Configuration
variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

# State Management
variable "state_bucket" {
  description = "S3 bucket for Terraform state"
  type        = string
  default     = "omniops-terraform-state"
}

variable "state_lock_table" {
  description = "DynamoDB table for state locking"
  type        = string
  default     = "terraform-state-lock"
}

# Networking
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# Domain Configuration
variable "domain_names" {
  description = "List of domain names for the application"
  type        = list(string)
  default     = ["omniops.co.uk", "www.omniops.co.uk"]
}

# Redis Configuration
variable "redis_node_type" {
  description = "Node type for Redis cluster"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_nodes" {
  description = "Number of Redis nodes"
  type        = number
  default     = 1
}

# Supabase Configuration
variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  sensitive   = false
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key (public)"
  type        = string
  sensitive   = false
}

variable "supabase_service_role_key" {
  description = "Supabase service role key (secret)"
  type        = string
  sensitive   = true
}

variable "supabase_jwt_secret" {
  description = "Supabase JWT secret"
  type        = string
  sensitive   = true
}

# OpenAI Configuration
variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

# Vercel Configuration
variable "vercel_api_token" {
  description = "Vercel API token for deployment"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "GitHub repository for the application"
  type        = string
  default     = "your-org/omniops"
}

# Monitoring & Logging
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
}

# Resource Tagging
variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "DevOps Team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "Engineering"
}

# Scaling Configuration
variable "min_capacity" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of instances"
  type        = number
  default     = 2
}

# Instance Configuration
variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.medium"
}

variable "instance_ami" {
  description = "AMI ID for application servers (leave empty to use latest Ubuntu)"
  type        = string
  default     = ""
}

# Database Configuration (if using RDS instead of Supabase)
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "omniops"
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "omniops_admin"
}

variable "db_password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

# Feature Flags
variable "enable_monitoring" {
  description = "Enable CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "enable_backups" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "enable_encryption" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "enable_cdn" {
  description = "Enable CloudFront CDN"
  type        = bool
  default     = true
}

# Cost Optimization
variable "use_spot_instances" {
  description = "Use spot instances for cost savings"
  type        = bool
  default     = false
}

variable "spot_max_price" {
  description = "Maximum price for spot instances"
  type        = string
  default     = "0.05"
}

# Security Configuration
variable "allowed_ips" {
  description = "List of allowed IPs for SSH access"
  type        = list(string)
  default     = []
}

variable "ssh_key_name" {
  description = "Name of the SSH key pair"
  type        = string
  default     = ""
}

# Application Configuration
variable "app_port" {
  description = "Port on which the application runs"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "Path for health check endpoint"
  type        = string
  default     = "/api/health"
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

# Rate Limiting
variable "rate_limit_requests_per_minute" {
  description = "Maximum requests per minute per IP"
  type        = number
  default     = 60
}

# Cache Configuration
variable "cache_ttl" {
  description = "Default cache TTL in seconds"
  type        = number
  default     = 3600
}

# Scraping Configuration
variable "max_scrape_pages" {
  description = "Maximum pages to scrape per job"
  type        = number
  default     = 100
}

variable "scrape_timeout" {
  description = "Scraping timeout in milliseconds"
  type        = number
  default     = 30000
}

# Map of environment-specific defaults
locals {
  env_config = {
    development = {
      instance_type = "t3.micro"
      redis_node_type = "cache.t3.micro"
      min_capacity = 1
      max_capacity = 2
    }
    staging = {
      instance_type = "t3.small"
      redis_node_type = "cache.t3.small"
      min_capacity = 1
      max_capacity = 5
    }
    production = {
      instance_type = "t3.medium"
      redis_node_type = "cache.r6g.large"
      min_capacity = 3
      max_capacity = 20
    }
  }

  # Override defaults with environment-specific values
  effective_instance_type = try(local.env_config[var.environment].instance_type, var.instance_type)
  effective_redis_node_type = try(local.env_config[var.environment].redis_node_type, var.redis_node_type)
  effective_min_capacity = try(local.env_config[var.environment].min_capacity, var.min_capacity)
  effective_max_capacity = try(local.env_config[var.environment].max_capacity, var.max_capacity)
}