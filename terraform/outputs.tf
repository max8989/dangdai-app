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

output "acr_login_server" {
  description = "ACR login server URL"
  value       = azurerm_container_registry.main.login_server
}

output "acr_admin_username" {
  description = "ACR admin username"
  value       = azurerm_container_registry.main.admin_username
}

output "acr_admin_password" {
  description = "ACR admin password"
  value       = azurerm_container_registry.main.admin_password
  sensitive   = true
}

output "pwa_url" {
  description = "URL of the deployed PWA (Static Web App)"
  value       = "https://${azurerm_static_web_app.pwa.default_host_name}"
}

output "pwa_deployment_token" {
  description = "Deployment token for uploading the PWA build to the Static Web App"
  value       = azurerm_static_web_app.pwa.api_key
  sensitive   = true
}
