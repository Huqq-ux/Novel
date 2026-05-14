import pytest
from unittest.mock import patch, MagicMock
from app.core.context import ConversationContext, ContextManager, ConversationMessage


class TestConversationContext:
    def test_add_message(self):
        ctx = ConversationContext(session_id="test-1")
        ctx.add_message("user", "你好")
        ctx.add_message("assistant", "你好！有什么可以帮你的？")

        assert len(ctx.messages) == 2
        assert ctx.messages[0].role == "user"
        assert ctx.messages[0].content == "你好"
        assert ctx.messages[1].role == "assistant"

    def test_get_history(self):
        ctx = ConversationContext(session_id="test-2")
        for i in range(10):
            ctx.add_message("user", f"消息{i}")
            ctx.add_message("assistant", f"回复{i}")

        history = ctx.get_history(max_turns=3)
        assert len(history) == 6
        assert history[0]["content"] == "消息7"

    def test_to_dict_and_from_dict(self):
        ctx = ConversationContext(
            session_id="test-3",
            user_id=1,
            module="recommend",
            intent="book_search",
        )
        ctx.add_message("user", "推荐科幻小说")
        ctx.add_message("assistant", "好的，为您推荐...")
        ctx.entities = {"category": "科幻"}

        data = ctx.to_dict()
        restored = ConversationContext.from_dict(data)

        assert restored.session_id == "test-3"
        assert restored.user_id == 1
        assert restored.module == "recommend"
        assert restored.intent == "book_search"
        assert len(restored.messages) == 2
        assert restored.entities == {"category": "科幻"}


class TestContextManager:
    def test_get_context_new(self):
        with patch.object(ContextManager, '_get_redis', return_value=None):
            manager = ContextManager()
            ctx = manager.get_context("new-session")
            assert ctx.session_id == "new-session"
            assert len(ctx.messages) == 0

    def test_save_and_get_context(self):
        with patch.object(ContextManager, '_get_redis', return_value=None):
            manager = ContextManager()
            ctx = ConversationContext(session_id="save-test")
            ctx.add_message("user", "测试消息")

            manager.save_context(ctx)
            retrieved = manager.get_context("save-test")
            assert retrieved.messages[0].content == "测试消息"

    def test_delete_context(self):
        with patch.object(ContextManager, '_get_redis', return_value=None):
            manager = ContextManager()
            ctx = ConversationContext(session_id="delete-test")
            manager.save_context(ctx)

            manager.delete_context("delete-test")
            assert "delete-test" not in manager._local_cache
