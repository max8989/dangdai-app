"""Tests for infrastructure configuration files."""

import os
from pathlib import Path


class TestDockerfile:
    """Tests for the Dockerfile configuration."""

    def test_dockerfile_exists(self):
        """Test that Dockerfile exists in dangdai-api directory."""
        dockerfile_path = Path(__file__).parent.parent.parent / "Dockerfile"
        assert dockerfile_path.exists(), (
            "Dockerfile should exist in dangdai-api directory"
        )

    def test_dockerfile_uses_python_311_slim(self):
        """Test that Dockerfile uses Python 3.11 slim base image."""
        dockerfile_path = Path(__file__).parent.parent.parent / "Dockerfile"
        content = dockerfile_path.read_text()
        assert "FROM python:3.11-slim" in content, "Should use Python 3.11 slim image"

    def test_dockerfile_exposes_port_8000(self):
        """Test that Dockerfile exposes port 8000."""
        dockerfile_path = Path(__file__).parent.parent.parent / "Dockerfile"
        content = dockerfile_path.read_text()
        assert "EXPOSE 8000" in content, "Should expose port 8000"

    def test_dockerfile_uses_uvicorn(self):
        """Test that Dockerfile uses uvicorn as entrypoint."""
        dockerfile_path = Path(__file__).parent.parent.parent / "Dockerfile"
        content = dockerfile_path.read_text()
        assert "uvicorn" in content, "Should use uvicorn"
        assert "src.api.main:app" in content, "Should reference correct app module"


class TestTerraformConfiguration:
    """Tests for Terraform configuration files."""

    @property
    def terraform_dir(self) -> Path:
        """Get the terraform directory path."""
        return Path(__file__).parent.parent.parent.parent / "terraform"

    def test_terraform_directory_exists(self):
        """Test that terraform directory exists at project root."""
        assert self.terraform_dir.exists(), (
            "terraform/ directory should exist at project root"
        )

    def test_main_tf_exists(self):
        """Test that main.tf exists."""
        main_tf = self.terraform_dir / "main.tf"
        assert main_tf.exists(), "main.tf should exist in terraform directory"

    def test_variables_tf_exists(self):
        """Test that variables.tf exists."""
        variables_tf = self.terraform_dir / "variables.tf"
        assert variables_tf.exists(), "variables.tf should exist in terraform directory"

    def test_outputs_tf_exists(self):
        """Test that outputs.tf exists."""
        outputs_tf = self.terraform_dir / "outputs.tf"
        assert outputs_tf.exists(), "outputs.tf should exist in terraform directory"

    def test_tfvars_example_exists(self):
        """Test that terraform.tfvars.example exists."""
        tfvars_example = self.terraform_dir / "terraform.tfvars.example"
        assert tfvars_example.exists(), "terraform.tfvars.example should exist"

    def test_gitignore_exists(self):
        """Test that .gitignore exists in terraform directory."""
        gitignore = self.terraform_dir / ".gitignore"
        assert gitignore.exists(), ".gitignore should exist in terraform directory"

    def test_main_tf_has_azure_provider(self):
        """Test that main.tf configures Azure provider."""
        main_tf = self.terraform_dir / "main.tf"
        content = main_tf.read_text()
        assert "azurerm" in content, "Should configure Azure provider"
        assert "hashicorp/azurerm" in content, "Should use hashicorp azurerm provider"

    def test_main_tf_has_resource_group(self):
        """Test that main.tf creates resource group."""
        main_tf = self.terraform_dir / "main.tf"
        content = main_tf.read_text()
        assert "azurerm_resource_group" in content, "Should create resource group"

    def test_main_tf_has_container_app_environment(self):
        """Test that main.tf creates Container Apps environment."""
        main_tf = self.terraform_dir / "main.tf"
        content = main_tf.read_text()
        assert "azurerm_container_app_environment" in content, (
            "Should create Container Apps environment"
        )

    def test_main_tf_has_container_app(self):
        """Test that main.tf creates container app."""
        main_tf = self.terraform_dir / "main.tf"
        content = main_tf.read_text()
        assert "azurerm_container_app" in content, "Should create container app"
        assert "dangdai-api" in content, "Should name container app dangdai-api"

    def test_main_tf_has_scale_to_zero(self):
        """Test that main.tf configures scale-to-zero."""
        main_tf = self.terraform_dir / "main.tf"
        content = main_tf.read_text()
        assert "min_replicas = 0" in content, (
            "Should configure scale-to-zero with min_replicas = 0"
        )
        assert "max_replicas = 10" in content, "Should configure max_replicas = 10"

    def test_main_tf_has_correct_resource_limits(self):
        """Test that main.tf configures correct resource limits."""
        main_tf = self.terraform_dir / "main.tf"
        content = main_tf.read_text()
        assert "cpu    = 0.5" in content, "Should configure 0.5 vCPU"
        assert '"1Gi"' in content, "Should configure 1GB memory"

    def test_main_tf_has_secrets_configuration(self):
        """Test that main.tf configures secrets for sensitive values."""
        main_tf = self.terraform_dir / "main.tf"
        content = main_tf.read_text()
        assert "supabase-service-key" in content, (
            "Should configure supabase service key secret"
        )
        assert "llm-api-key" in content, "Should configure LLM API key secret"

    def test_main_tf_has_environment_variables(self):
        """Test that main.tf configures required environment variables."""
        main_tf = self.terraform_dir / "main.tf"
        content = main_tf.read_text()
        assert "SUPABASE_URL" in content, "Should configure SUPABASE_URL env var"
        assert "SUPABASE_SERVICE_KEY" in content, (
            "Should configure SUPABASE_SERVICE_KEY env var"
        )
        assert "LLM_API_KEY" in content, "Should configure LLM_API_KEY env var"

    def test_main_tf_has_log_analytics(self):
        """Test that main.tf creates Log Analytics workspace."""
        main_tf = self.terraform_dir / "main.tf"
        content = main_tf.read_text()
        assert "azurerm_log_analytics_workspace" in content, (
            "Should create Log Analytics workspace"
        )

    def test_main_tf_has_external_ingress(self):
        """Test that main.tf configures external ingress."""
        main_tf = self.terraform_dir / "main.tf"
        content = main_tf.read_text()
        assert "external_enabled = true" in content, "Should enable external ingress"
        assert "target_port      = 8000" in content, "Should target port 8000"

    def test_variables_tf_has_required_variables(self):
        """Test that variables.tf defines all required variables."""
        variables_tf = self.terraform_dir / "variables.tf"
        content = variables_tf.read_text()
        required_vars = [
            "project_name",
            "resource_group_name",
            "location",
            "image_tag",
            "supabase_url",
            "supabase_service_key",
            "llm_api_key",
        ]
        for var in required_vars:
            assert f'variable "{var}"' in content, f"Should define variable {var}"

    def test_variables_tf_marks_secrets_sensitive(self):
        """Test that sensitive variables are marked as sensitive."""
        variables_tf = self.terraform_dir / "variables.tf"
        content = variables_tf.read_text()
        assert "sensitive   = true" in content, "Should mark sensitive variables"

    def test_outputs_tf_exports_api_url(self):
        """Test that outputs.tf exports the API URL."""
        outputs_tf = self.terraform_dir / "outputs.tf"
        content = outputs_tf.read_text()
        assert 'output "api_url"' in content, "Should output api_url"
        assert "fqdn" in content, "Should use FQDN for API URL"

    def test_gitignore_excludes_tfstate(self):
        """Test that .gitignore excludes state files."""
        gitignore = self.terraform_dir / ".gitignore"
        content = gitignore.read_text()
        assert "*.tfstate" in content, "Should exclude tfstate files"
        assert ".terraform/" in content, "Should exclude .terraform directory"

    def test_gitignore_excludes_tfvars(self):
        """Test that .gitignore excludes terraform.tfvars with secrets."""
        gitignore = self.terraform_dir / ".gitignore"
        content = gitignore.read_text()
        assert "terraform.tfvars" in content, "Should exclude terraform.tfvars"
