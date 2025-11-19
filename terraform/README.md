# Terraform Infrastructure as Code

**Type:** Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Prerequisites:** Terraform 1.5+, AWS/GCP/Azure CLI

## Purpose
Infrastructure as Code (IaC) configuration for provisioning and managing Omniops cloud resources using Terraform.

## Quick Links
- [Kubernetes Deployment](../k8s/README.md)
- [Docker Setup](../docs/00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md)
- [Disaster Recovery](../docs/05-OPERATIONS/RUNBOOK_DISASTER_RECOVERY.md)

## Directory Structure

```
terraform/
├── README.md               # This file
├── main.tf                # Main configuration
├── variables.tf           # Variable definitions
├── outputs.tf            # Output definitions
├── versions.tf           # Provider versions
├── terraform.tfvars.example  # Example variables file
├── .gitignore            # Git ignore rules
├── modules/              # Reusable modules
│   ├── networking/      # VPC, subnets, etc.
│   ├── compute/         # EC2, containers, etc.
│   └── database/        # RDS, Supabase config
└── environments/         # Environment-specific configs
    ├── development/
    ├── staging/
    └── production/
```

## Prerequisites

### 1. Install Terraform

```bash
# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Linux
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Verify installation
terraform --version
```

### 2. Configure Cloud Provider

```bash
# AWS
aws configure
aws sts get-caller-identity

# Google Cloud
gcloud auth application-default login
gcloud config set project PROJECT_ID

# Azure
az login
az account show
```

### 3. Backend Configuration (S3 for state)

```bash
# Create S3 bucket for Terraform state
aws s3 mb s3://omniops-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket omniops-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket omniops-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

## Quick Start

### 1. Initialize Terraform

```bash
cd terraform

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit variables with your values
vim terraform.tfvars

# Initialize Terraform
terraform init
```

### 2. Plan Infrastructure

```bash
# Review what will be created
terraform plan

# Save plan for apply
terraform plan -out=tfplan
```

### 3. Apply Configuration

```bash
# Apply saved plan
terraform apply tfplan

# Or apply with auto-approve (careful!)
terraform apply -auto-approve
```

### 4. Verify Resources

```bash
# Show current state
terraform show

# List resources
terraform state list

# Output values
terraform output
```

## Managing Environments

### Development Environment

```bash
cd environments/development
terraform init
terraform plan -var-file="dev.tfvars"
terraform apply -var-file="dev.tfvars"
```

### Staging Environment

```bash
cd environments/staging
terraform init
terraform plan -var-file="staging.tfvars"
terraform apply -var-file="staging.tfvars"
```

### Production Environment

```bash
cd environments/production

# Extra caution for production
terraform plan -var-file="prod.tfvars" -out=prod.tfplan

# Review plan carefully
terraform show prod.tfplan

# Apply after review
terraform apply prod.tfplan
```

## State Management

### Remote State Configuration

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "omniops-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

### State Commands

```bash
# List resources in state
terraform state list

# Show specific resource
terraform state show aws_instance.app

# Move resource
terraform state mv aws_instance.old aws_instance.new

# Remove from state (doesn't destroy actual resource)
terraform state rm aws_instance.app

# Pull remote state
terraform state pull > terraform.tfstate

# Push local state to remote
terraform state push terraform.tfstate
```

### State Locking (DynamoDB)

```bash
# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

## Import Existing Resources

```bash
# Import Supabase project (manual - Supabase doesn't have Terraform provider yet)
# Document the configuration for reference

# Import existing AWS resources
terraform import aws_instance.app i-1234567890abcdef0
terraform import aws_db_instance.database mydb-instance

# Import Vercel project (using Vercel provider)
terraform import vercel_project.app PROJECT_ID
```

## Destroy Resources

```bash
# Show what will be destroyed
terraform plan -destroy

# Destroy specific resource
terraform destroy -target=aws_instance.app

# Destroy everything (WARNING!)
terraform destroy

# Force destroy without confirmation
terraform destroy -auto-approve
```

## Best Practices

### 1. Use Variables

```hcl
# variables.tf
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "development"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}
```

### 2. Use Modules

```hcl
# main.tf
module "networking" {
  source = "./modules/networking"

  vpc_cidr     = var.vpc_cidr
  environment  = var.environment
}

module "compute" {
  source = "./modules/compute"

  subnet_id     = module.networking.subnet_id
  instance_type = var.instance_type
}
```

### 3. Tag Everything

```hcl
locals {
  common_tags = {
    Environment = var.environment
    Project     = "omniops"
    ManagedBy   = "terraform"
    Owner       = var.owner
    CostCenter  = var.cost_center
  }
}

resource "aws_instance" "app" {
  # ... other configuration ...
  tags = merge(local.common_tags, {
    Name = "omniops-app-${var.environment}"
    Role = "application"
  })
}
```

### 4. Use Data Sources

```hcl
# Fetch existing resources
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

data "aws_vpc" "existing" {
  id = var.existing_vpc_id
}
```

## Security Considerations

### 1. Sensitive Variables

```hcl
# variables.tf
variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# terraform.tfvars (never commit!)
database_password = "super-secret-password"
```

### 2. Provider Configuration

```hcl
# providers.tf
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }

  # Assume role for cross-account access
  assume_role {
    role_arn = "arn:aws:iam::ACCOUNT_ID:role/TerraformRole"
  }
}
```

### 3. Resource Policies

```hcl
# S3 bucket with encryption
resource "aws_s3_bucket" "data" {
  bucket = "omniops-data-${var.environment}"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'
  pull_request:
    paths:
      - 'terraform/**'

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0

      - name: Terraform Init
        run: terraform init
        working-directory: ./terraform

      - name: Terraform Format Check
        run: terraform fmt -check
        working-directory: ./terraform

      - name: Terraform Validate
        run: terraform validate
        working-directory: ./terraform

      - name: Terraform Plan
        run: terraform plan
        working-directory: ./terraform
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Troubleshooting

### Common Issues

1. **State Lock Error**
   ```bash
   # Force unlock (use carefully!)
   terraform force-unlock LOCK_ID
   ```

2. **Version Conflicts**
   ```bash
   # Upgrade providers
   terraform init -upgrade
   ```

3. **Resource Already Exists**
   ```bash
   # Import existing resource
   terraform import RESOURCE_TYPE.NAME RESOURCE_ID
   ```

4. **Plan Shows Unexpected Changes**
   ```bash
   # Refresh state
   terraform refresh

   # Or ignore changes
   lifecycle {
     ignore_changes = [tags]
   }
   ```

## Cost Estimation

```bash
# Estimate costs with Infracost
brew install infracost

infracost auth login
infracost breakdown --path .
infracost diff --path .
```

## Cleanup

```bash
# Destroy all resources
terraform destroy -auto-approve

# Remove local files
rm -rf .terraform/
rm terraform.tfstate*
rm .terraform.lock.hcl
```

## Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Vercel Provider](https://registry.terraform.io/providers/vercel/vercel/latest/docs)
- [Best Practices](https://www.terraform-best-practices.com)
- [Terraform Patterns](https://github.com/terraform-aws-modules)