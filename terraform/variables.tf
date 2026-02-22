variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
  sensitive   = true
}

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

variable "image_tag" {
  description = "Docker image tag for the API"
  type        = string
  default     = "latest"
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
  description = "LLM API key (legacy, deprecated)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "azure_openai_location" {
  description = "Azure region for the OpenAI resource"
  type        = string
  default     = "eastus"
}

variable "azure_openai_deployment_name" {
  description = "Azure OpenAI model deployment name"
  type        = string
  default     = "gpt-4o"
}

variable "azure_openai_tpm_limit" {
  description = "Azure OpenAI tokens per minute rate limit (in thousands)"
  type        = number
  default     = 30
}

variable "langsmith_api_key" {
  description = "LangSmith API key for observability (optional)"
  type        = string
  sensitive   = true
  default     = ""
}
