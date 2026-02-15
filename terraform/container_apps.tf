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

      # Optional: LangSmith observability
      dynamic "env" {
        for_each = var.langsmith_api_key != "" ? [1] : []
        content {
          name        = "LANGSMITH_API_KEY"
          secret_name = "langsmith-api-key"
        }
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
