import pytest
from dotenv import load_dotenv

from tests.support.factories import (
    make_book,
    make_chapter,
    make_quiz_question,
    make_quiz_request,
    make_quiz_result,
    make_user,
)

# Load environment variables from .env file for tests
load_dotenv()


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


# ---------------------------------------------------------------------------
# Factory fixtures — callable, accept keyword overrides
# ---------------------------------------------------------------------------


@pytest.fixture
def make_quiz_request_fixture():
    """Factory fixture: returns a callable that creates quiz request dicts."""
    return make_quiz_request


@pytest.fixture
def make_quiz_result_fixture():
    """Factory fixture: returns a callable that creates quiz result dicts."""
    return make_quiz_result


@pytest.fixture
def make_quiz_question_fixture():
    """Factory fixture: returns a callable that creates quiz question dicts."""
    return make_quiz_question


@pytest.fixture
def make_chapter_fixture():
    """Factory fixture: returns a callable that creates chapter dicts."""
    return make_chapter


@pytest.fixture
def make_book_fixture():
    """Factory fixture: returns a callable that creates book dicts."""
    return make_book


@pytest.fixture
def make_user_fixture():
    """Factory fixture: returns a callable that creates user dicts."""
    return make_user


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
