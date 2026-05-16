# Azure Static Web App for the dangdai-pwa (Vite React build).
#
# Static Web Apps are not available in every region — pick one from the supported list:
# westus2, centralus, eastus2, westeurope, eastasia. We use eastus2 (closest to the
# rest of the stack in eastus).
resource "azurerm_static_web_app" "pwa" {
  name                = "${var.project_name}-pwa"
  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus2"
  sku_tier            = "Free"
  sku_size            = "Free"
}
