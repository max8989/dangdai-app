"""Tests for the LLM provider factory.

Verify that get_llm() correctly instantiates the right provider
based on environment variables and validates required credentials.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest


class TestAzureOpenAIProvider:
    """Tests for Azure OpenAI provider instantiation."""

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "azure_openai",
            "AZURE_OPENAI_API_KEY": "test-azure-key",
            "AZURE_OPENAI_ENDPOINT": "https://test.openai.azure.com/",
            "AZURE_OPENAI_DEPLOYMENT_NAME": "gpt-4o",
            "AZURE_OPENAI_API_VERSION": "2024-02-15-preview",
        },
        clear=False,
    )
    def test_azure_openai_happy_path(self):
        """Test Azure OpenAI provider returns AzureChatOpenAI instance."""
        from langchain_openai import AzureChatOpenAI

        from src.utils.llm_factory import get_llm

        llm = get_llm()
        assert isinstance(llm, AzureChatOpenAI)

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "azure_openai",
            "AZURE_OPENAI_API_KEY": "test-azure-key",
            "AZURE_OPENAI_ENDPOINT": "https://test.openai.azure.com/",
            "AZURE_OPENAI_DEPLOYMENT_NAME": "gpt-4o",
            "AZURE_OPENAI_API_VERSION": "2024-02-15-preview",
        },
        clear=False,
    )
    def test_azure_openai_correct_deployment(self):
        """Test Azure OpenAI uses correct deployment name and API version."""
        from src.utils.llm_factory import get_llm

        llm = get_llm()
        assert llm.deployment_name == "gpt-4o"  # type: ignore[attr-defined]
        assert llm.openai_api_version == "2024-02-15-preview"  # type: ignore[attr-defined]

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "azure_openai",
            "AZURE_OPENAI_ENDPOINT": "https://test.openai.azure.com/",
            "AZURE_OPENAI_DEPLOYMENT_NAME": "gpt-4o",
        },
        clear=True,
    )
    def test_azure_openai_missing_api_key(self):
        """Test ValueError when AZURE_OPENAI_API_KEY is missing."""
        from src.utils.llm_factory import get_llm

        with pytest.raises(ValueError, match="AZURE_OPENAI_API_KEY"):
            get_llm()

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "azure_openai",
            "AZURE_OPENAI_API_KEY": "test-key",
            "AZURE_OPENAI_DEPLOYMENT_NAME": "gpt-4o",
        },
        clear=True,
    )
    def test_azure_openai_missing_endpoint(self):
        """Test ValueError when AZURE_OPENAI_ENDPOINT is missing."""
        from src.utils.llm_factory import get_llm

        with pytest.raises(ValueError, match="AZURE_OPENAI_ENDPOINT"):
            get_llm()

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "azure_openai",
            "AZURE_OPENAI_API_KEY": "test-key",
            "AZURE_OPENAI_ENDPOINT": "https://test.openai.azure.com/",
        },
        clear=True,
    )
    def test_azure_openai_missing_deployment_name(self):
        """Test ValueError when AZURE_OPENAI_DEPLOYMENT_NAME is missing."""
        from src.utils.llm_factory import get_llm

        with pytest.raises(ValueError, match="AZURE_OPENAI_DEPLOYMENT_NAME"):
            get_llm()

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "azure_openai",
        },
        clear=True,
    )
    def test_azure_openai_all_credentials_missing(self):
        """Test ValueError lists all missing Azure vars."""
        from src.utils.llm_factory import get_llm

        with pytest.raises(ValueError, match="AZURE_OPENAI_API_KEY"):
            get_llm()


class TestOpenAIProvider:
    """Tests for OpenAI provider instantiation."""

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "openai",
            "OPENAI_API_KEY": "sk-test-key",
        },
        clear=False,
    )
    def test_openai_happy_path(self):
        """Test OpenAI provider returns ChatOpenAI instance."""
        from langchain_openai import ChatOpenAI

        from src.utils.llm_factory import get_llm

        llm = get_llm()
        assert isinstance(llm, ChatOpenAI)

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "openai",
            "OPENAI_API_KEY": "sk-test-key",
        },
        clear=False,
    )
    def test_openai_correct_model(self):
        """Test OpenAI uses correct default model (gpt-5)."""
        from src.utils.llm_factory import get_llm

        llm = get_llm()
        assert llm.model_name == "gpt-5"  # type: ignore[attr-defined]

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "openai",
            "OPENAI_API_KEY": "sk-test-key",
            "OPENAI_MODEL": "gpt-5",
        },
        clear=False,
    )
    def test_openai_model_env_override(self):
        """Test OPENAI_MODEL env var overrides default model for OpenAI."""
        from src.utils.llm_factory import get_llm

        llm = get_llm()
        assert llm.model_name == "gpt-5"  # type: ignore[attr-defined]

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "openai",
        },
        clear=True,
    )
    def test_openai_missing_api_key(self):
        """Test ValueError when OPENAI_API_KEY is missing."""
        from src.utils.llm_factory import get_llm

        with pytest.raises(ValueError, match="OPENAI_API_KEY"):
            get_llm()


class TestDefaultProvider:
    """Tests for default provider behavior."""

    @patch.dict(
        "os.environ",
        {
            "OPENAI_API_KEY": "sk-test-key",
        },
        clear=True,
    )
    def test_default_provider_is_openai(self):
        """Test that default provider is openai when LLM_PROVIDER not set (Story 4.17)."""
        from langchain_openai import ChatOpenAI

        from src.utils.llm_factory import get_llm

        llm = get_llm()
        assert isinstance(llm, ChatOpenAI)
        assert llm.model_name == "gpt-5"  # type: ignore[attr-defined]


class TestUnsupportedProvider:
    """Tests for unsupported provider values."""

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "unsupported_provider",
        },
        clear=True,
    )
    def test_unsupported_provider_raises_value_error(self):
        """Test ValueError for unsupported LLM_PROVIDER value."""
        from src.utils.llm_factory import get_llm

        with pytest.raises(
            ValueError, match="Unsupported LLM_PROVIDER: unsupported_provider"
        ):
            get_llm()

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "foo",
        },
        clear=True,
    )
    def test_unsupported_provider_foo(self):
        """Test ValueError message for provider 'foo'."""
        from src.utils.llm_factory import get_llm

        with pytest.raises(ValueError, match="Unsupported LLM_PROVIDER: foo"):
            get_llm()


class TestParameterOverrides:
    """Tests for temperature and max_tokens parameters."""

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "openai",
            "OPENAI_API_KEY": "sk-test-key",
            "LLM_MODEL": "gpt-4o",
        },
        clear=False,
    )
    def test_custom_temperature_and_max_tokens(self):
        """Test custom temperature and max_tokens are passed to a non-reasoning model."""
        from src.utils.llm_factory import get_llm

        llm = get_llm(temperature=0.9, max_tokens=4096)
        assert llm.temperature == 0.9  # type: ignore[attr-defined]
        assert llm.max_tokens == 4096  # type: ignore[attr-defined]

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "azure_openai",
            "AZURE_OPENAI_API_KEY": "test-azure-key",
            "AZURE_OPENAI_ENDPOINT": "https://test.openai.azure.com/",
            "AZURE_OPENAI_DEPLOYMENT_NAME": "gpt-4o",
        },
        clear=False,
    )
    def test_azure_custom_parameters(self):
        """Test custom max_tokens flows through to Azure OpenAI provider."""
        from src.utils.llm_factory import get_llm

        llm = get_llm(temperature=0.3, max_tokens=1024)
        assert llm.max_tokens == 1024  # type: ignore[attr-defined]

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "openai",
            "OPENAI_API_KEY": "sk-test-key",
            "LLM_MODEL": "gpt-4o",
        },
        clear=False,
    )
    def test_default_parameters(self):
        """Test default temperature=0.7 and max_tokens=4096 (Story 4.17)."""
        from src.utils.llm_factory import get_llm

        llm = get_llm()
        assert llm.temperature == 0.7  # type: ignore[attr-defined]
        assert llm.max_tokens == 4096  # type: ignore[attr-defined]


class TestModelOverride:
    """Tests for LLM_MODEL environment variable override."""

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "openai",
            "OPENAI_API_KEY": "sk-test-key",
            "LLM_MODEL": "gpt-4-turbo",
        },
        clear=False,
    )
    def test_model_override_openai(self):
        """Test LLM_MODEL overrides default model for OpenAI."""
        from src.utils.llm_factory import get_llm

        llm = get_llm()
        assert llm.model_name == "gpt-4-turbo"  # type: ignore[attr-defined]

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "azure_openai",
            "AZURE_OPENAI_API_KEY": "test-key",
            "AZURE_OPENAI_ENDPOINT": "https://test.openai.azure.com/",
            "AZURE_OPENAI_DEPLOYMENT_NAME": "gpt-4o",
            "LLM_MODEL": "gpt-4-turbo",
        },
        clear=False,
    )
    def test_model_override_azure_openai(self):
        """Test LLM_MODEL overrides default model for Azure OpenAI."""
        from src.utils.llm_factory import get_llm

        llm = get_llm()
        assert llm.model_name == "gpt-4-turbo"  # type: ignore[attr-defined]


class TestProviderOverrideParameter:
    """Tests for the provider parameter override."""

    @patch.dict(
        "os.environ",
        {
            "LLM_PROVIDER": "azure_openai",
            "OPENAI_API_KEY": "sk-test-key",
        },
        clear=False,
    )
    def test_provider_parameter_overrides_env(self):
        """Test provider parameter overrides LLM_PROVIDER env var."""
        from langchain_openai import ChatOpenAI

        from src.utils.llm_factory import get_llm

        llm = get_llm(provider="openai")
        assert isinstance(llm, ChatOpenAI)


class TestTerraformOpenAI:
    """Tests for OpenAI Terraform configuration (Story 4.17 — Azure OpenAI decommissioned)."""

    @property
    def terraform_dir(self):
        """Get the terraform directory path."""
        from pathlib import Path

        return Path(__file__).parent.parent.parent / "terraform"

    def _read_all_tf_files(self) -> str:
        """Read all .tf files in terraform directory."""
        content = ""
        for tf_file in self.terraform_dir.glob("*.tf"):
            content += tf_file.read_text() + "\n"
        return content

    def test_openai_tf_has_no_azure_cognitive_resources(self):
        """openai.tf must not declare any Azure cognitive resources."""
        openai_tf = self.terraform_dir / "openai.tf"
        assert openai_tf.exists()
        content = openai_tf.read_text()
        assert 'resource "azurerm_cognitive_account"' not in content
        assert 'resource "azurerm_cognitive_deployment"' not in content

    def test_container_app_env_vars_point_to_openai(self):
        """Container app env vars should set LLM_PROVIDER=openai and reference OPENAI_* vars."""
        content = self._read_all_tf_files()
        assert "LLM_PROVIDER" in content
        assert "OPENAI_API_KEY" in content
        assert "OPENAI_MODEL" in content

    def test_variables_has_openai_vars(self):
        """variables.tf must declare the openai_api_key and openai_model variables."""
        variables_tf = self.terraform_dir / "variables.tf"
        content = variables_tf.read_text()
        assert "openai_api_key" in content
        assert "openai_model" in content
