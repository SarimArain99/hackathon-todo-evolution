"""
Agent Service for AI Chatbot.

Integrates OpenAI API with MCP (Model Context Protocol) server tools
for natural language task management.

This service uses the FastMCP server to expose task management tools
that the AI agent can invoke through OpenAI's function calling API.
"""

import json
import os
from typing import Optional

from openai import OpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ChatResponse, CreateMessageRequest, ToolCall
from app.mcp_server.server import get_tool_definitions, get_tool_function
from app.mcp_server.tools import clear_mcp_context, set_mcp_context
from app.services.conversation_service import ConversationService
from app.logging_config import get_logger


logger = get_logger(__name__)


class AgentService:
    """
    Service for AI agent interactions with MCP tool calling.

    Uses OpenAI API with function calling for task management.
    Tools are provided by the FastMCP server defined in app.mcp_server.
    """

    # System prompt for the AI agent
    SYSTEM_PROMPT = """You are a helpful todo assistant. You help users manage their tasks through natural language.

Available capabilities:
- Create new tasks with titles, descriptions, priorities, tags, and due dates
- List and filter tasks by status, priority, or search text
- Mark tasks as complete
- Update existing task details including due dates
- Delete tasks

Due date support:
- Accept ISO format: "2025-01-15"
- Accept natural language: "tomorrow", "next week", "in 3 days", "today"
- Always include due dates when showing tasks if they exist

Guidelines:
1. Be concise and friendly in your responses
2. When creating tasks, extract relevant information from the user's message
3. Use sensible defaults: priority="medium", no tags unless specified
4. Confirm actions after completing them (e.g., "Task created: Buy groceries due tomorrow")
5. If the user asks to see their tasks, use list_tasks with no filters
6. For ambiguous requests, ask clarifying questions
7. Keep responses under 100 words when possible
"""

    # OpenAI API timeout (seconds)
    API_TIMEOUT = float(os.getenv("OPENAI_TIMEOUT", "30.0"))

    def __init__(self):
        """Initialize the OpenAI client with API key from environment."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("openai_api_key_missing")
            raise ValueError("OPENAI_API_KEY environment variable is required")

        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

        self.client = OpenAI(api_key=api_key, timeout=self.API_TIMEOUT)
        self.model = model

        # Get tool definitions from MCP server
        self._tool_definitions = get_tool_definitions()

        logger.info("agent_service_initialized", model=model, timeout=self.API_TIMEOUT)

    def _get_function_definitions(self) -> list[dict]:
        """
        Get OpenAI function definitions from MCP server.

        Returns list of function schemas for OpenAI's function calling API.
        These definitions are sourced from the FastMCP server.
        """
        return self._tool_definitions

    async def _execute_tool_call(
        self,
        function_name: str,
        function_args: dict,
        session: AsyncSession,
        user_id: str,
    ) -> dict:
        """
        Execute a tool call using MCP server tools.

        This method sets the MCP context (session and user_id) for the tools,
        then invokes the appropriate tool function from the MCP server.

        Args:
            function_name: Name of the function to call
            function_args: Arguments for the function
            session: Database session
            user_id: Current user ID

        Returns:
            Result from the tool execution
        """
        logger.debug("tool_call_started", tool=function_name, user_id=user_id)

        try:
            # Set MCP context for tool execution
            await set_mcp_context(session, user_id)

            # Get the tool function from MCP server
            tool_func = get_tool_function(function_name)

            # Execute the tool
            result = await tool_func(**function_args)

            logger.info("tool_call_completed", tool=function_name, user_id=user_id)
            return result

        except Exception as e:
            logger.error("tool_call_failed", tool=function_name, user_id=user_id, error=str(e))
            return {"error": str(e)}

        finally:
            # Clear MCP context after execution
            clear_mcp_context()

    async def process_message(
        self,
        request: CreateMessageRequest,
        session: AsyncSession,
        user_id: str,
    ) -> ChatResponse:
        """
        Process a user message through the AI agent.

        This method:
        1. Gets or creates a conversation
        2. Stores the user message
        3. Loads conversation history (last 50 messages)
        4. Calls OpenAI with MCP tools available
        5. Executes any tool calls via MCP server
        6. Stores the assistant response
        7. Returns the response

        Args:
            request: Message request with content and optional conversation_id
            session: Database session
            user_id: Current user ID

        Returns:
            Chat response with assistant message and tool calls
        """
        import time

        start_time = time.time()
        logger.info("message_processing_started", user_id=user_id, conversation_id=request.conversation_id)

        try:
            # Get or create conversation
            conversation = await ConversationService.get_or_create(
                session,
                user_id,
                request.conversation_id,
            )

            # Store user message
            await ConversationService.add_message(
                session,
                conversation.id,
                "user",
                request.message,
                user_id=user_id,  # Pass user_id for Qdrant storage
            )

            # Build conversation history (last 50 messages)
            messages = await ConversationService.get_messages(
                session,
                conversation.id,
                user_id,
                limit=50,
            )

            # Convert to OpenAI format
            openai_messages = [{"role": "system", "content": self.SYSTEM_PROMPT}]
            for msg in messages:
                openai_messages.append({
                    "role": msg.role,
                    "content": msg.content or "",
                })

            # Track tool calls made
            tool_calls_made: list[ToolCall] = []

            # Call OpenAI with potential for multiple tool rounds
            max_rounds = 5
            current_round = 0

            while current_round < max_rounds:
                current_round += 1

                logger.debug("openai_request_started", round=current_round, model=self.model)

                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=openai_messages,
                    tools=self._get_function_definitions(),
                    tool_choice="auto" if current_round == 1 else "none",
                )

                message = response.choices[0].message

                logger.debug("openai_request_completed", round=current_round,
                           has_tool_calls=bool(message.tool_calls))

                # Check for tool calls
                if message.tool_calls:
                    # Add assistant message with tool calls
                    openai_messages.append({
                        "role": "assistant",
                        "content": message.content or "",
                        "tool_calls": [
                            {
                                "id": tc.id,
                                "type": tc.type,
                                "function": {
                                    "name": tc.function.name,
                                    "arguments": tc.function.arguments,
                                },
                            }
                            for tc in message.tool_calls
                        ],
                    })

                    # Execute each tool call via MCP server
                    for tool_call in message.tool_calls:
                        func_name = tool_call.function.name
                        func_args = json.loads(tool_call.function.arguments)

                        result = await self._execute_tool_call(
                            func_name,
                            func_args,
                            session,
                            user_id,
                        )

                        # Record tool call for response
                        tool_calls_made.append(
                            ToolCall(
                                name=func_name,
                                arguments=func_args,
                            )
                        )

                        # Add tool result to conversation
                        openai_messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": json.dumps(result),
                        })

                    # Continue loop to let AI respond to tool results
                    continue

                # No more tool calls - this is the final response
                assistant_message = message.content or "I couldn't process that request."

                # Store assistant message
                await ConversationService.add_message(
                    session,
                    conversation.id,
                    "assistant",
                    assistant_message,
                    tool_calls=[tc.model_dump() for tc in tool_calls_made],
                    user_id=user_id,  # Pass user_id for Qdrant storage
                )

                elapsed = time.time() - start_time
                logger.info("message_processing_completed", user_id=user_id,
                           conversation_id=conversation.id, elapsed_seconds=elapsed,
                           tool_calls_count=len(tool_calls_made))

                return ChatResponse(
                    message=assistant_message,
                    conversation_id=conversation.id,
                    tool_calls=tool_calls_made,
                )

            # Max rounds reached
            logger.warning("max_rounds_reached", user_id=user_id,
                          conversation_id=conversation.id, max_rounds=max_rounds)
            return ChatResponse(
                message="I'm sorry, I couldn't complete that request. Please try again.",
                conversation_id=conversation.id,
                tool_calls=tool_calls_made,
            )

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error("message_processing_failed", user_id=user_id,
                        conversation_id=request.conversation_id, elapsed_seconds=elapsed,
                        error_type=type(e).__name__, error_message=str(e))
            raise
