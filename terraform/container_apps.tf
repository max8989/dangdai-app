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
        name  = "LLM_PROVIDER"
        value = "azure_openai"
      }

      env {
        name  = "AZURE_OPENAI_ENDPOINT"
        value = azurerm_cognitive_account.openai.endpoint
      }

      env {
        name        = "AZURE_OPENAI_API_KEY"
        secret_name = "azure-openai-api-key"
      }

      env {
        name  = "AZURE_OPENAI_DEPLOYMENT_NAME"
        value = var.azure_openai_deployment_name
      }

      env {
        name  = "LLM_MODEL"
        value = "gpt-4o"
      }

      env {
        name  = "AZURE_OPENAI_API_VERSION"
        value = var.azure_openai_api_version
      }

      env {
        name        = "SUPABASE_JWT_SECRET"
        secret_name = "supabase-jwt-secret"
      }

      # Legacy LLM_API_KEY (deprecated, kept for backward compatibility)
      dynamic "env" {
        for_each = var.llm_api_key != "" ? [1] : []
        content {
          name        = "LLM_API_KEY"
          secret_name = "llm-api-key"
        }
      }

      env {
        name  = "HOST"
        value = "0.0.0.0"
      }

      env {
        name  = "PORT"
        value = "8000"
      }

      # Optional: LangSmith observability
      dynamic "env" {
        for_each = var.langsmith_api_key != "" ? [1] : []
        content {
          name        = "LANGSMITH_API_KEY"
          secret_name = "langsmith-api-key"
        }
      }
    }

    min_replicas = 0 # Scale to zero when not in use
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
    name  = "azure-openai-api-key"
    value = azurerm_cognitive_account.openai.primary_access_key
  }

  secret {
    name  = "supabase-jwt-secret"
    value = var.supabase_jwt_secret
  }

  # Legacy LLM API key secret (deprecated, only if provided)
  dynamic "secret" {
    for_each = var.llm_api_key != "" ? [1] : []
    content {
      name  = "llm-api-key"
      value = var.llm_api_key
    }
  }

  # Optional: LangSmith secret (only created if key provided)
  dynamic "secret" {
    for_each = var.langsmith_api_key != "" ? [1] : []
    content {
      name  = "langsmith-api-key"
      value = var.langsmith_api_key
    }
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
