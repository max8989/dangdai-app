# Story 1.6: Deploy Python Backend to Azure Container Apps

Status: ready-for-dev

## Story

As a developer,
I want to deploy the Python backend to Azure Container Apps using Terraform,
So that the quiz generation API is accessible from the mobile app.

## Acceptance Criteria

1. **Given** the Python backend scaffold exists and runs locally
   **When** I apply the Terraform configuration
   **Then** Azure Container Apps environment is created

2. **Given** Terraform is applied
   **When** I check Azure resources
   **Then** the dangdai-api container is deployed with scale-to-zero configuration

3. **Given** the container is deployed
   **When** I check environment variables
   **Then** environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY, LLM_API_KEY) are configured

4. **Given** the deployment is complete
   **When** I make a request to the public URL
   **Then** the `/health` endpoint is accessible via public URL

5. **Given** the API is deployed
   **When** the mobile app makes a request
   **Then** the mobile app can reach the deployed API

## Tasks / Subtasks

- [ ] Task 1: Set up Terraform configuration (AC: #1)
  - [ ] 1.1 Create `terraform/` directory in project root
  - [ ] 1.2 Create `main.tf` with Azure provider and resource group
  - [ ] 1.3 Create `variables.tf` with input variables
  - [ ] 1.4 Create `outputs.tf` for API URL output
  - [ ] 1.5 Create `terraform.tfvars.example` template

- [ ] Task 2: Create Container Apps environment (AC: #1)
  - [ ] 2.1 Define Azure Container Apps Environment resource
  - [ ] 2.2 Configure Log Analytics workspace
  - [ ] 2.3 Set up networking for public access

- [ ] Task 3: Create container app resource (AC: #2)
  - [ ] 3.1 Define container app with Python backend image
  - [ ] 3.2 Configure scale-to-zero (min replicas: 0, max: 10)
  - [ ] 3.3 Set resource limits (0.5 vCPU, 1GB memory)
  - [ ] 3.4 Configure ingress for external access

- [ ] Task 4: Configure secrets and environment (AC: #3)
  - [ ] 4.1 Create secrets for SUPABASE_SERVICE_KEY and LLM_API_KEY
  - [ ] 4.2 Configure environment variables referencing secrets
  - [ ] 4.3 Add non-secret environment variables (SUPABASE_URL, etc.)

- [ ] Task 5: Create Dockerfile (AC: #2)
  - [ ] 5.1 Create `Dockerfile` in dangdai-api directory
  - [ ] 5.2 Use Python 3.11 slim base image
  - [ ] 5.3 Install dependencies from pyproject.toml
  - [ ] 5.4 Configure uvicorn as entrypoint

- [ ] Task 6: Deploy and verify (AC: #4, #5)
  - [ ] 6.1 Run `terraform init`
  - [ ] 6.2 Run `terraform plan` and review
  - [ ] 6.3 Run `terraform apply`
  - [ ] 6.4 Test `/health` endpoint from public URL
  - [ ] 6.5 Update mobile app with production API URL

## Dev Notes

### Critical Architecture Requirements

**From Architecture - Azure Container Apps:**
```
Azure Container Apps
├── dangdai-api (Python/LangGraph)
│   ├── Scale: 0-10 instances
│   ├── Memory: 1GB
│   └── CPU: 0.5 vCPU
└── Environment Variables
    ├── SUPABASE_URL
    ├── SUPABASE_SERVICE_KEY
    ├── LLM_API_KEY
    └── LANGSMITH_API_KEY (optional)
```

### Terraform Directory Structure

```
terraform/
├── main.tf                    # Azure provider, resource group, container app
├── variables.tf               # Input variables
├── outputs.tf                 # Output values (API URL)
├── terraform.tfvars.example   # Example variable values
└── .gitignore                 # Ignore .tfstate files
```

### Main Terraform Configuration

**Create `terraform/main.tf`:**

```hcl
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
}

# Log Analytics Workspace (required for Container Apps)
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# Container Apps Environment
resource "azurerm_container_app_environment" "main" {
  name                       = "${var.project_name}-env"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}

# Container App - dangdai-api
resource "azurerm_container_app" "api" {
  name                         = "dangdai-api"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  template {
    container {
      name   = "dangdai-api"
      image  = var.container_image
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "SUPABASE_URL"
        value = var.supabase_url
      }

      env {
        name        = "SUPABASE_SERVICE_KEY"
        secret_name = "supabase-service-key"
      }

      env {
        name        = "LLM_API_KEY"
        secret_name = "llm-api-key"
      }

      env {
        name  = "HOST"
        value = "0.0.0.0"
      }

      env {
        name  = "PORT"
        value = "8000"
      }
    }

    min_replicas = 0  # Scale to zero when not in use
    max_replicas = 10
  }

  secret {
    name  = "supabase-service-key"
    value = var.supabase_service_key
  }

  secret {
    name  = "llm-api-key"
    value = var.llm_api_key
  }

  ingress {
    external_enabled = true
    target_port      = 8000
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}
```

### Variables Configuration

**Create `terraform/variables.tf`:**

```hcl
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "dangdai"
}

variable "resource_group_name" {
  description = "Name of the Azure resource group"
  type        = string
  default     = "dangdai-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "container_image" {
  description = "Container image for the API"
  type        = string
  # Will be updated with ACR image after CI/CD setup
  default     = "ghcr.io/your-username/dangdai-api:latest"
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  sensitive   = false
}

variable "supabase_service_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}

variable "llm_api_key" {
  description = "LLM API key (OpenAI, Anthropic, etc.)"
  type        = string
  sensitive   = true
}
```

### Outputs Configuration

**Create `terraform/outputs.tf`:**

```hcl
output "api_url" {
  description = "URL of the deployed API"
  value       = "https://${azurerm_container_app.api.ingress[0].fqdn}"
}

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "container_app_name" {
  description = "Name of the container app"
  value       = azurerm_container_app.api.name
}
```

### Example Variables File

**Create `terraform/terraform.tfvars.example`:**

```hcl
# Copy this file to terraform.tfvars and fill in values
# DO NOT commit terraform.tfvars with real values

project_name         = "dangdai"
resource_group_name  = "dangdai-rg"
location             = "eastus"
container_image      = "ghcr.io/your-username/dangdai-api:latest"
supabase_url         = "https://xxx.supabase.co"
supabase_service_key = "eyJ..."
llm_api_key          = "sk-..."
```

### Dockerfile

**Create `dangdai-api/Dockerfile`:**

```dockerfile
# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml .
COPY README.md .

# Install Python dependencies
RUN pip install --no-cache-dir .

# Copy application code
COPY src/ ./src/

# Expose port
EXPOSE 8000

# Run with uvicorn
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Terraform Gitignore

**Create `terraform/.gitignore`:**

```
# Terraform state files
*.tfstate
*.tfstate.*
.terraform/
.terraform.lock.hcl

# Variable files with secrets
terraform.tfvars
*.auto.tfvars

# Crash log files
crash.log
crash.*.log
```

### Deployment Commands

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Preview changes
terraform plan -var-file="terraform.tfvars"

# Apply changes
terraform apply -var-file="terraform.tfvars"

# Get output URL
terraform output api_url
```

### Scale-to-Zero Configuration

The configuration sets `min_replicas = 0` which means:
- Container scales down to zero when not receiving traffic
- First request after scale-down has ~5-10 second cold start
- Cost-efficient for MVP with low traffic
- Can increase `min_replicas = 1` later for always-warm API

### Container Image Strategy

For MVP, you can:

1. **GitHub Container Registry (GHCR):**
   ```bash
   # Build and push to GHCR
   docker build -t ghcr.io/your-username/dangdai-api:latest .
   docker push ghcr.io/your-username/dangdai-api:latest
   ```

2. **Azure Container Registry (ACR):**
   - Create ACR via Terraform or portal
   - Push images to ACR
   - Update container_image variable

### Environment Variable Security

| Variable | Type | Storage |
|----------|------|---------|
| SUPABASE_URL | Non-secret | Direct env var |
| SUPABASE_SERVICE_KEY | Secret | Azure secret reference |
| LLM_API_KEY | Secret | Azure secret reference |
| HOST, PORT | Non-secret | Direct env var |

### Anti-Patterns to Avoid

- **DO NOT** commit `terraform.tfvars` with real secrets
- **DO NOT** hardcode secrets in Terraform files
- **DO NOT** skip scale-to-zero for MVP (cost savings)
- **DO NOT** expose service keys in logs or error messages
- **DO NOT** use `:latest` tag in production (use specific versions)

### Verification Steps

```bash
# After terraform apply:

# Get the API URL
API_URL=$(terraform output -raw api_url)

# Test health endpoint
curl "${API_URL}/health"
# Expected: {"status": "healthy"}

# Test from mobile app .env
# Update EXPO_PUBLIC_API_URL with the API_URL value
```

### Azure CLI Alternative

If you prefer Azure CLI over Terraform for initial setup:

```bash
# Login to Azure
az login

# Create resource group
az group create --name dangdai-rg --location eastus

# Create Container Apps environment
az containerapp env create \
  --name dangdai-env \
  --resource-group dangdai-rg \
  --location eastus

# Deploy container app
az containerapp create \
  --name dangdai-api \
  --resource-group dangdai-rg \
  --environment dangdai-env \
  --image ghcr.io/your-username/dangdai-api:latest \
  --target-port 8000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 10 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars "SUPABASE_URL=https://xxx.supabase.co" \
  --secrets "supabase-key=xxx" "llm-key=xxx" \
  --secret-env-vars "SUPABASE_SERVICE_KEY=supabase-key" "LLM_API_KEY=llm-key"
```

### Dependencies from Epic 1

- **Depends on:** Story 1-2 (Python backend exists), Story 1-3 (Supabase configured)
- **Blocks:** Story 1-7 (CI/CD needs deployment target)

### Cost Considerations

- Azure Container Apps with scale-to-zero is very cost-effective
- You only pay when the container is running
- $200 Azure credit should last several months for MVP usage
- Monitor costs in Azure portal

### References

- [Source: architecture.md#Infrastructure-Deployment] - Azure architecture
- [Source: architecture.md#Azure-Architecture] - Container Apps config
- [Source: epics.md#Story-1.6] - Story requirements

### External Documentation

- Azure Container Apps: https://learn.microsoft.com/en-us/azure/container-apps/
- Terraform AzureRM Provider: https://registry.terraform.io/providers/hashicorp/azurerm/latest
- Azure Container Apps Terraform: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/container_app

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
