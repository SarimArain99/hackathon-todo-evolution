"""
Chat API and AI Agent Tests for Phase III - AI Chatbot.

Tests cover:
- Contract tests for API endpoints
- Integration tests for MCP tools (via OpenAI function calling)
- Conversation context and persistence tests
"""

import os
import pytest
from unittest.mock import MagicMock
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_session
from app.models import SQLModel, User, Task, Conversation, Message

# Set required environment variables for tests
os.environ["OPENAI_API_KEY"] = "test-key-for-mocking"
os.environ["OPENAI_MODEL"] = "gpt-4o-mini"


def create_mock_jwt_token(user_id: str, email: str) -> str:
    """
    Create a mock JWT token for testing purposes.

    This creates a simplified JWT that the auth module can decode.
    The token structure matches what Better Auth issues.
    """
    import json
    import base64
    from datetime import datetime, UTC, timedelta

    # JWT header
    header = {"alg": "RS256", "typ": "JWT"}
    header_encoded = base64.urlsafe_b64encode(
        json.dumps(header).encode()
    ).decode().rstrip('=')

    # JWT payload
    exp_time = int((datetime.now(UTC) + timedelta(hours=1)).timestamp())
    payload = {
        "sub": user_id,
        "email": email,
        "name": "Test User",
        "exp": exp_time,
        "iat": int(datetime.now(UTC).timestamp()),
    }
    payload_encoded = base64.urlsafe_b64encode(
        json.dumps(payload).encode()
    ).decode().rstrip('=')

    # Mock signature (not verified in test mode)
    signature = "mock_signature"

    return f"{header_encoded}.{payload_encoded}.{signature}"


def create_mock_openai_response(content: str, tool_calls_data: list = None):
    """Create a mock OpenAI API response."""
    mock_response = MagicMock()
    mock_message = MagicMock()
    mock_message.content = content

    if tool_calls_data:
        mock_tool_calls = []
        for tc_data in tool_calls_data:
            mock_tc = MagicMock()
            mock_tc.id = tc_data.get("id", "test_tc_id")
            mock_tc.type = "function"

            mock_func = MagicMock()
            mock_func.name = tc_data["name"]
            mock_func.arguments = tc_data["arguments"]
            mock_tc.function = mock_func

            mock_tool_calls.append(mock_tc)

        mock_message.tool_calls = mock_tool_calls
    else:
        mock_message.tool_calls = None

    mock_choice = MagicMock()
    mock_choice.message = mock_message

    mock_response.choices = [mock_choice]
    return mock_response


@pytest.fixture
def mock_openai(monkeypatch):
    """Fixture that mocks the OpenAI client for tests."""
    def mock_create(*args, **kwargs):
        # Default: simple response without tool calls
        return create_mock_openai_response("Response from AI")

    import app.services.agent_service

    # Save original __init__
    original_init = app.services.agent_service.OpenAI.__init__

    def mock_init(self, *args, **kwargs):
        original_init(self, *args, **kwargs)
        # Replace the chat.completions.create method
        self.chat.completions.create = mock_create

    monkeypatch.setattr(app.services.agent_service.OpenAI, "__init__", mock_init)

    return mock_create


@pytest.fixture
def mock_openai_with_tools(monkeypatch):
    """Fixture that mocks OpenAI with configurable tool calls for integration tests.

    Returns a function that can be called with custom tool_calls_data.
    The mock will return tool calls on the first request and a normal response on subsequent requests.
    """
    mock_state = {"tool_calls_data": None, "call_count": 0}

    def mock_create(*args, **kwargs):
        mock_state["call_count"] += 1
        # First call: return tool calls if configured
        if mock_state["call_count"] == 1 and mock_state["tool_calls_data"]:
            return create_mock_openai_response(
                "Processing your request...",
                tool_calls_data=mock_state["tool_calls_data"]
            )
        # Subsequent calls: return normal response (no more tool calls)
        return create_mock_openai_response("Task completed successfully")

    import app.services.agent_service

    # Save original __init__
    original_init = app.services.agent_service.OpenAI.__init__

    def mock_init(self, *args, **kwargs):
        original_init(self, *args, **kwargs)
        # Replace the chat.completions.create method
        self.chat.completions.create = mock_create

    monkeypatch.setattr(app.services.agent_service.OpenAI, "__init__", mock_init)

    def set_tool_calls(tool_calls_data):
        mock_state["tool_calls_data"] = tool_calls_data
        mock_state["call_count"] = 0  # Reset count when setting new tool calls

    return set_tool_calls


# =============================================================================
# Test Database Setup
# =============================================================================

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


async def get_test_session():
    """Create a test database session."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async_session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    # Yield session
    async with async_session_maker() as session:
        yield session

    # Drop tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
async def test_session():
    """Fixture providing a test database session."""
    async for session in get_test_session():
        yield session


@pytest.fixture
async def test_user(test_session: AsyncSession):
    """Fixture providing a test user."""
    user = User(
        id="test-user-id",
        email="test@example.com",
        name="Test User",
        hashed_password="hashed_password_here",
    )
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User):
    """Fixture providing authentication headers."""
    token = create_mock_jwt_token(test_user.id, test_user.email)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def client(test_session: AsyncSession):
    """Fixture providing an async test client with database override."""
    # Override the database dependency
    async def override_get_session():
        yield test_session

    app.dependency_overrides[get_session] = override_get_session

    # Create test client
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    # Clean up
    app.dependency_overrides.clear()


# =============================================================================
# Contract Tests (T010, T017, T020, T023, T026)
# =============================================================================

class TestChatAPIContract:
    """Contract tests for chat API endpoints."""

    @pytest.mark.asyncio
    async def test_create_conversation_requires_auth(self, client: AsyncClient):
        """T010: Test that POST /api/chat requires authentication."""
        response = await client.post("/api/chat", json={"message": "Hello"})
        assert response.status_code == 401  # Unauthorized

    @pytest.mark.asyncio
    async def test_post_chat_returns_conversation_id(
        self,
        client: AsyncClient,
        test_user: User,
        auth_headers: dict,
        mock_openai,
    ):
        """T010: Contract test for POST /api/chat creating tasks via natural language.

        This test verifies the API contract without requiring actual OpenAI API calls.
        """
        response = await client.post(
            "/api/chat",
            json={"message": "Add a task to buy groceries"},
            headers=auth_headers,
        )

        # Check response structure
        assert response.status_code == 200
        data = response.json()
        assert "conversation_id" in data
        assert "message" in data
        assert "tool_calls" in data
        assert isinstance(data["tool_calls"], list)

    @pytest.mark.asyncio
    async def test_list_conversations(
        self,
        client: AsyncClient,
        test_user: User,
        auth_headers: dict,
    ):
        """Test GET /api/chat/conversations endpoint."""
        response = await client.get(
            "/api/chat/conversations",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_get_conversation_by_id(
        self,
        client: AsyncClient,
        test_user: User,
        auth_headers: dict,
        test_session: AsyncSession,
    ):
        """Test GET /api/chat/conversations/{id} endpoint."""
        # Create a test conversation
        conv = Conversation(user_id=test_user.id)
        test_session.add(conv)
        await test_session.commit()
        await test_session.refresh(conv)

        response = await client.get(
            f"/api/chat/conversations/{conv.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "conversation" in data
        assert "messages" in data

    @pytest.mark.asyncio
    async def test_delete_conversation(
        self,
        client: AsyncClient,
        test_user: User,
        auth_headers: dict,
        test_session: AsyncSession,
    ):
        """Test DELETE /api/chat/conversations/{id} endpoint."""
        # Create a test conversation
        conv = Conversation(user_id=test_user.id)
        test_session.add(conv)
        await test_session.commit()
        await test_session.refresh(conv)

        response = await client.delete(
            f"/api/chat/conversations/{conv.id}",
            headers=auth_headers,
        )
        assert response.status_code == 204


# =============================================================================
# MCP Server Tests
# =============================================================================

class TestMCPServer:
    """Tests for MCP server functionality."""

    @pytest.mark.asyncio
    async def test_mcp_server_initializes(self):
        """Test that MCP server initializes correctly."""
        from app.mcp_server.server import get_mcp_server, get_available_tools

        mcp = get_mcp_server()
        assert mcp is not None

        tools = get_available_tools()
        assert "add_task" in tools
        assert "list_tasks" in tools
        assert "complete_task" in tools
        assert "update_task" in tools
        assert "delete_task" in tools

    @pytest.mark.asyncio
    async def test_mcp_tool_definitions(self):
        """Test that MCP tool definitions are properly formatted."""
        from app.mcp_server.server import get_tool_definitions

        definitions = get_tool_definitions()
        assert len(definitions) == 5

        # Check each tool has required structure
        for tool_def in definitions:
            assert tool_def["type"] == "function"
            assert "function" in tool_def
            assert "name" in tool_def["function"]
            assert "description" in tool_def["function"]
            assert "parameters" in tool_def["function"]


# =============================================================================
# Integration Tests for MCP Tools (T011)
# =============================================================================

class TestMCPToolsIntegration:
    """Integration tests for MCP tool functionality via AgentService."""

    @pytest.mark.asyncio
    async def test_add_task_tool_creates_task(
        self,
        test_session: AsyncSession,
        test_user: User,
        mock_openai_with_tools,
    ):
        """T011: Integration test for add_task MCP tool.

        Verifies that the add_task function correctly creates a task in the database.
        """
        # Set up the mock to return a tool call for add_task
        mock_openai_with_tools([{
            "id": "test_tc_1",
            "name": "add_task",
            "arguments": '{"title": "Buy groceries", "priority": "medium"}'
        }])

        from app.services.agent_service import AgentService
        from app.models import CreateMessageRequest

        agent = AgentService()
        request = CreateMessageRequest(
            message="Add a task to buy groceries",
            conversation_id=None,
        )

        response = await agent.process_message(request, test_session, test_user.id)

        # Verify response
        assert response.conversation_id is not None
        assert "Buy groceries" in response.message or "task" in response.message.lower()

        # Verify task was created in database
        from sqlalchemy import select
        stmt = select(Task).where(Task.user_id == test_user.id)
        result = await test_session.execute(stmt)
        tasks = result.scalars().all()
        assert len(tasks) >= 1

    @pytest.mark.asyncio
    async def test_list_tasks_tool(
        self,
        test_session: AsyncSession,
        test_user: User,
        mock_openai,
    ):
        """T017: Integration test for list_tasks MCP tool."""
        # Create test tasks
        task1 = Task(user_id=test_user.id, title="Task 1", completed=False)
        task2 = Task(user_id=test_user.id, title="Task 2", completed=True)
        test_session.add_all([task1, task2])
        await test_session.commit()

        from app.services.agent_service import AgentService, CreateMessageRequest

        agent = AgentService()
        request = CreateMessageRequest(message="What tasks do I have?")

        response = await agent.process_message(request, test_session, test_user.id)

        assert response.conversation_id is not None
        assert response.message is not None


# =============================================================================
# Task Completion Tests (T020)
# =============================================================================

class TestTaskCompletion:
    """Tests for task completion functionality."""

    @pytest.mark.asyncio
    async def test_complete_task_tool(
        self,
        test_session: AsyncSession,
        test_user: User,
        mock_openai_with_tools,
    ):
        """T020: Integration test for complete_task MCP tool.

        Verifies that complete_task correctly marks a task as completed.
        """
        # Create test task
        task = Task(user_id=test_user.id, title="Task to complete", completed=False)
        test_session.add(task)
        await test_session.commit()
        await test_session.refresh(task)

        task_id = task.id

        # Set up the mock to return a tool call for complete_task
        mock_openai_with_tools([{
            "id": "test_tc_complete",
            "name": "complete_task",
            "arguments": f'{{"task_id": {task_id}}}'
        }])

        from app.services.agent_service import AgentService, CreateMessageRequest

        agent = AgentService()
        request = CreateMessageRequest(message=f"Mark task {task_id} as complete")

        response = await agent.process_message(request, test_session, test_user.id)

        assert response.conversation_id is not None

        # Verify task is marked complete
        await test_session.refresh(task)
        assert task.completed is True


# =============================================================================
# Task Modification Tests (T023)
# =============================================================================

class TestTaskModification:
    """Tests for task modification functionality."""

    @pytest.mark.asyncio
    async def test_update_task_tool(
        self,
        test_session: AsyncSession,
        test_user: User,
        mock_openai_with_tools,
    ):
        """T023: Integration test for update_task MCP tool.

        Verifies that update_task correctly modifies task details.
        """
        # Create test task
        task = Task(user_id=test_user.id, title="Original title", completed=False)
        test_session.add(task)
        await test_session.commit()
        await test_session.refresh(task)

        task_id = task.id
        new_title = "Updated title"

        # Set up the mock to return a tool call for update_task
        mock_openai_with_tools([{
            "id": "test_tc_update",
            "name": "update_task",
            "arguments": f'{{"task_id": {task_id}, "title": "{new_title}"}}'
        }])

        from app.services.agent_service import AgentService, CreateMessageRequest

        agent = AgentService()
        request = CreateMessageRequest(message=f"Change task {task_id} to {new_title}")

        response = await agent.process_message(request, test_session, test_user.id)

        assert response.conversation_id is not None

        # Verify task is updated
        await test_session.refresh(task)
        assert task.title == new_title


# =============================================================================
# Task Deletion Tests (T026)
# =============================================================================

class TestTaskDeletion:
    """Tests for task deletion functionality."""

    @pytest.mark.asyncio
    async def test_delete_task_tool(
        self,
        test_session: AsyncSession,
        test_user: User,
        mock_openai_with_tools,
    ):
        """T026: Integration test for delete_task MCP tool.

        Verifies that delete_task correctly removes a task from the database.
        """
        # Create test task
        task = Task(user_id=test_user.id, title="Task to delete", completed=False)
        test_session.add(task)
        await test_session.commit()
        await test_session.refresh(task)

        task_id = task.id

        # Set up the mock to return a tool call for delete_task
        mock_openai_with_tools([{
            "id": "test_tc_delete",
            "name": "delete_task",
            "arguments": f'{{"task_id": {task_id}}}'
        }])

        from app.services.agent_service import AgentService, CreateMessageRequest

        agent = AgentService()
        request = CreateMessageRequest(message=f"Delete task {task_id}")

        response = await agent.process_message(request, test_session, test_user.id)

        assert response.conversation_id is not None

        # Verify task is deleted
        from sqlalchemy import select
        stmt = select(Task).where(Task.id == task_id)
        result = await test_session.execute(stmt)
        deleted_task = result.scalar_one_or_none()
        assert deleted_task is None


# =============================================================================
# Conversation Memory Tests (T029, T030)
# =============================================================================

class TestConversationMemory:
    """Tests for conversation context and persistence."""

    @pytest.mark.asyncio
    async def test_conversation_context_loading(
        self,
        test_session: AsyncSession,
        test_user: User,
        mock_openai,
    ):
        """T029: Integration test for conversation context loading.

        Verifies that the agent loads conversation history when provided with a conversation_id.
        """
        # Create conversation with existing messages
        conv = Conversation(user_id=test_user.id)
        test_session.add(conv)
        await test_session.commit()
        await test_session.refresh(conv)

        msg1 = Message(
            conversation_id=conv.id,
            role="user",
            content="Add task: Buy milk",
        )
        msg2 = Message(
            conversation_id=conv.id,
            role="assistant",
            content="I've added the task 'Buy milk'.",
        )
        test_session.add_all([msg1, msg2])
        await test_session.commit()

        from app.services.agent_service import AgentService, CreateMessageRequest

        agent = AgentService()
        request = CreateMessageRequest(
            message="Also add eggs",
            conversation_id=conv.id,
        )

        response = await agent.process_message(request, test_session, test_user.id)

        # Verify that conversation was used (same ID)
        assert response.conversation_id == conv.id

    @pytest.mark.asyncio
    async def test_conversation_persistence_across_requests(
        self,
        test_session: AsyncSession,
        test_user: User,
        mock_openai,
    ):
        """T030: Integration test for conversation persistence across requests.

        Verifies that:
        1. Messages are stored in database after each request
        2. Conversation state survives across multiple requests
        3. New conversation is created when conversation_id is None
        """
        from app.services.agent_service import AgentService, CreateMessageRequest
        from sqlalchemy import select

        agent = AgentService()

        # First request - should create new conversation
        request1 = CreateMessageRequest(message="First message")
        response1 = await agent.process_message(request1, test_session, test_user.id)

        assert response1.conversation_id is not None
        conv_id_1 = response1.conversation_id

        # Verify conversation and messages were stored
        stmt = select(Conversation).where(Conversation.id == conv_id_1)
        conv_result = await test_session.execute(stmt)
        conversation = conv_result.scalar_one_or_none()
        assert conversation is not None
        assert conversation.user_id == test_user.id

        msg_stmt = select(Message).where(Message.conversation_id == conv_id_1)
        msg_result = await test_session.execute(msg_stmt)
        messages = msg_result.scalars().all()
        assert len(messages) == 2  # user message + assistant response

        # Second request with same conversation_id - should use existing conversation
        request2 = CreateMessageRequest(
            message="Second message",
            conversation_id=conv_id_1,
        )
        response2 = await agent.process_message(request2, test_session, test_user.id)

        assert response2.conversation_id == conv_id_1

        # Verify more messages were added
        msg_result2 = await test_session.execute(msg_stmt)
        messages2 = msg_result2.scalars().all()
        assert len(messages2) == 4  # 2 from first request + 2 from second

        # Third request with no conversation_id - should create new conversation
        request3 = CreateMessageRequest(message="Third message")
        response3 = await agent.process_message(request3, test_session, test_user.id)

        assert response3.conversation_id is not None
        assert response3.conversation_id != conv_id_1  # Different conversation
