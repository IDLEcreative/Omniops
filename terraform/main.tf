# Main Terraform Configuration for Omniops Infrastructure
# This manages the core infrastructure resources

terraform {
  required_version = ">= 1.5.0"

  # Configure remote state backend
  backend "s3" {
    bucket         = var.state_bucket
    key            = "${var.environment}/terraform.tfstate"
    region         = var.aws_region
    dynamodb_table = var.state_lock_table
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.16"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# Configure providers
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

# Local variables
locals {
  common_tags = {
    Environment = var.environment
    Project     = "omniops"
    ManagedBy   = "terraform"
    Owner       = var.owner
    CostCenter  = var.cost_center
    CreatedAt   = timestamp()
  }

  name_prefix = "omniops-${var.environment}"
}

# Data sources for existing resources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC and Networking
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${local.name_prefix}-vpc"
  cidr = var.vpc_cidr

  azs             = data.aws_availability_zones.available.names
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway = true
  enable_vpn_gateway = false
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Security Groups
resource "aws_security_group" "app" {
  name        = "${local.name_prefix}-app-sg"
  description = "Security group for Omniops application"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "App port"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-sg"
  })
}

# S3 Buckets
resource "aws_s3_bucket" "assets" {
  bucket = "${local.name_prefix}-assets"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-assets"
    Purpose = "Static assets and uploads"
  })
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 for backups
resource "aws_s3_bucket" "backups" {
  bucket = "${local.name_prefix}-backups"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backups"
    Purpose = "Database and application backups"
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "backup-lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled    = true
  default_root_object = "index.html"
  aliases             = var.domain_names
  price_class        = "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.assets.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.assets.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${aws_s3_bucket.assets.id}"

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress              = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    # For custom domain, use:
    # acm_certificate_arn = var.acm_certificate_arn
    # ssl_support_method  = "sni-only"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cdn"
  })
}

resource "aws_cloudfront_origin_access_identity" "assets" {
  comment = "OAI for ${local.name_prefix} assets"
}

# Secrets Manager for sensitive data
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${local.name_prefix}-secrets"
  recovery_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secrets"
  })
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    openai_api_key           = var.openai_api_key
    supabase_service_role_key = var.supabase_service_role_key
    supabase_jwt_secret      = var.supabase_jwt_secret
    encryption_key           = random_password.encryption_key.result
  })
}

resource "random_password" "encryption_key" {
  length  = 32
  special = true
}

# ElastiCache for Redis
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name_prefix}-redis-subnet"
  subnet_ids = module.vpc.private_subnets

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-subnet"
  })
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.name_prefix}-redis"
  description               = "Redis cache for Omniops"
  node_type                = var.redis_node_type
  num_cache_clusters        = var.redis_num_nodes
  port                     = 6379
  subnet_group_name        = aws_elasticache_subnet_group.redis.name
  security_group_ids       = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token               = random_password.redis_auth.result
  automatic_failover_enabled = var.environment == "production" ? true : false

  snapshot_retention_limit = var.environment == "production" ? 5 : 1
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "sun:05:00-sun:07:00"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis"
  })
}

resource "random_password" "redis_auth" {
  length  = 32
  special = false  # Redis AUTH doesn't support special characters
}

resource "aws_security_group" "redis" {
  name        = "${local.name_prefix}-redis-sg"
  description = "Security group for Redis"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "Redis from app"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-sg"
  })
}

# Vercel Project Configuration
resource "vercel_project" "app" {
  name      = "omniops-${var.environment}"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = var.github_repo
  }

  build_command    = "npm run build"
  output_directory = ".next"
  install_command  = "npm install"

  environment = [
    {
      key    = "NODE_ENV"
      value  = var.environment
      target = ["production", "preview", "development"]
    },
    {
      key    = "NEXT_PUBLIC_SUPABASE_URL"
      value  = var.supabase_url
      target = ["production", "preview", "development"]
    },
    {
      key    = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      value  = var.supabase_anon_key
      target = ["production", "preview", "development"]
    },
    {
      key    = "SUPABASE_SERVICE_ROLE_KEY"
      value  = var.supabase_service_role_key
      target = ["production"]
    },
    {
      key    = "OPENAI_API_KEY"
      value  = var.openai_api_key
      target = ["production"]
    },
    {
      key    = "REDIS_URL"
      value  = "redis://default:${random_password.redis_auth.result}@${aws_elasticache_replication_group.redis.configuration_endpoint_address}:6379"
      target = ["production"]
    }
  ]
}

resource "vercel_project_domain" "app" {
  project_id = vercel_project.app.id
  domain     = var.environment == "production" ? "omniops.co.uk" : "${var.environment}.omniops.co.uk"
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/omniops/${var.environment}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-logs"
  })
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alerts"
  })
}

resource "aws_sns_topic_subscription" "alert_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${local.name_prefix}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "300"
  statistic          = "Sum"
  threshold          = "10"
  alarm_description  = "This metric monitors error rate"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = "omniops-api"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-high-error-rate"
  })
}

# IAM Roles and Policies
resource "aws_iam_role" "app_role" {
  name = "${local.name_prefix}-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-role"
  })
}

resource "aws_iam_role_policy_attachment" "app_s3" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.app_s3.arn
}

resource "aws_iam_policy" "app_s3" {
  name        = "${local.name_prefix}-app-s3-policy"
  description = "Policy for app to access S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.assets.arn}/*"
        ]
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-s3-policy"
  })
}

# NOTE: Supabase configuration
# Supabase doesn't have an official Terraform provider yet
# Configure manually via dashboard or API
# Document configuration here for reference

/*
Manual Supabase Setup:
1. Create project at https://app.supabase.com
2. Configure authentication providers
3. Set up database schema (use migrations in /migrations)
4. Configure Row Level Security policies
5. Set up Edge Functions if needed
6. Configure storage buckets
*/