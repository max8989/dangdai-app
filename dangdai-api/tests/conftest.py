import pytest
from dotenv import load_dotenv

# Load environment variables from .env file for tests
load_dotenv()


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"
