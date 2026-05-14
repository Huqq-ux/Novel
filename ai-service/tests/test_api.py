import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock

from app.main import app


@pytest.fixture(autouse=True)
def mock_vector_store():
    with patch("app.main.vector_store") as mock_vs:
        mock_vs.index_books = MagicMock()
        mock_vs._ensure_init = MagicMock()
        mock_vs._collection = None
        yield mock_vs


@pytest.fixture(autouse=True)
def mock_context_manager():
    with patch("app.api.chat.context_manager") as mock_cm:
        from app.core.context import ConversationContext
        mock_cm.get_context.return_value = ConversationContext(session_id="test")
        mock_cm.save_context = MagicMock()
        mock_cm.delete_context = MagicMock()
        yield mock_cm


client = TestClient(app)


class TestRootEndpoint:
    def test_root(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "Novel AI Agent Service"
        assert "recommend" in data["modules"]
        assert "search" in data["modules"]
        assert "customer_service" in data["modules"]


class TestHealthEndpoint:
    def test_health_check(self):
        response = client.get("/api/ai/admin/health")
        assert response.status_code in [200, 503]


class TestChatEndpoints:
    def test_recommend_missing_message(self):
        response = client.post("/api/ai/recommend", json={})
        assert response.status_code == 422

    def test_search_missing_message(self):
        response = client.post("/api/ai/search", json={})
        assert response.status_code == 422

    def test_cs_missing_message(self):
        response = client.post("/api/ai/customer-service", json={})
        assert response.status_code == 422

    def test_recommend_empty_message(self):
        response = client.post("/api/ai/recommend", json={"message": ""})
        assert response.status_code == 422

    def test_recommend_message_too_long(self):
        response = client.post("/api/ai/recommend", json={"message": "x" * 2001})
        assert response.status_code == 422

    @patch("app.api.chat.recommend_service")
    def test_recommend_success(self, mock_service):
        mock_service.recommend = AsyncMock(return_value="为您推荐以下书籍...")
        response = client.post("/api/ai/recommend", json={"message": "推荐科幻小说"})
        assert response.status_code == 200
        data = response.json()
        assert data["module"] == "recommend"
        assert "session_id" in data

    @patch("app.api.chat.search_service")
    def test_search_success(self, mock_service):
        mock_service.search = AsyncMock(return_value="搜索结果如下...")
        response = client.post("/api/ai/search", json={"message": "搜索三体"})
        assert response.status_code == 200
        data = response.json()
        assert data["module"] == "search"

    @patch("app.api.chat.customer_service")
    def test_cs_success(self, mock_service):
        mock_service.chat = AsyncMock(return_value="您好，我是小阅...")
        response = client.post("/api/ai/customer-service", json={"message": "你好"})
        assert response.status_code == 200
        data = response.json()
        assert data["module"] == "customer_service"

    def test_session_clear(self):
        response = client.delete("/api/ai/session/test-session-id")
        assert response.status_code == 200

    def test_session_get(self):
        response = client.get("/api/ai/session/test-session-id")
        assert response.status_code == 200
