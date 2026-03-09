import pytest
from dotenv import load_dotenv

# Load environment variables from .env file for tests
load_dotenv()


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_call(item):
    """Suppress benign 'Event loop is closed' ExceptionGroup from anyio.

    When the LangGraph graph test runs before other async tests, httpx
    connections bound to the previous event loop get garbage-collected
    and anyio captures the resulting RuntimeError as an ExceptionGroup.
    This is benign (the test itself passed) and should not fail the suite.
    """
    outcome = yield
    if outcome.excinfo is not None:
        exc = outcome.excinfo[1]
        if _is_benign_event_loop_closed(exc):
            outcome.force_result(None)


def _is_benign_event_loop_closed(exc):
    """Check if all sub-exceptions are RuntimeError('Event loop is closed')."""
    if isinstance(exc, RuntimeError) and "Event loop is closed" in str(exc):
        return True
    if not isinstance(exc, BaseExceptionGroup):
        return False
    return all(_is_benign_event_loop_closed(e) for e in exc.exceptions)
