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
  subscription_id = "3addf805-4519-4ad0-abe7-c77e1ebdb7b4"
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
}

# Azure Container Registry
resource "azurerm_container_registry" "main" {
  name                = "${replace(var.project_name, "-", "")}acr"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
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

  # Registry configuration for ACR
  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "acr-password"
  }

  template {
    container {
      name   = "dangdai-api"
      image  = "${azurerm_container_registry.main.login_server}/dangdai-api:${var.image_tag}"
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
    name  = "acr-password"
    value = azurerm_container_registry.main.admin_password
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
