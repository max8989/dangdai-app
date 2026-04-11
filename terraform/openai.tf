# OpenAI Provider Configuration
#
# As of Story 4.17 (2026-04-11), the backend uses OpenAI directly (gpt-5) instead of
# Azure OpenAI Service. There is no Azure resource to provision — OpenAI is consumed
# as an external SaaS API via OPENAI_API_KEY (stored as a Container App secret; see
# container_apps.tf).
#
# The previous `azurerm_cognitive_account.openai` and `azurerm_cognitive_deployment.gpt4o`
# resources were removed in Story 4.17. If you need to roll back to Azure OpenAI, restore
# them from git history and set LLM_PROVIDER=azure_openai in container_apps.tf.
