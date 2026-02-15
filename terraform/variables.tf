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
  description = "LLM API key (OpenAI, Anthropic, etc.)"
  type        = string
  sensitive   = true
}

variable "langsmith_api_key" {
  description = "LangSmith API key for observability (optional)"
  type        = string
  sensitive   = true
  default     = ""
}
