import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from app.modules.recommend import RecommendService, build_recommend_graph
from app.modules.search import SearchService, build_search_graph
from app.modules.customer_service import CustomerService, build_cs_graph, KNOWLEDGE_BASE


class TestRecommendGraph:
    def test_graph_builds(self):
        graph = build_recommend_graph()
        assert graph is not None

    def test_graph_nodes(self):
        graph = build_recommend_graph()
        node_names = set(graph.nodes.keys())
        expected = {"extract_preference", "retrieve_candidates", "rank_and_recommend"}
        assert expected.issubset(node_names)


class TestSearchGraph:
    def test_graph_builds(self):
        graph = build_search_graph()
        assert graph is not None

    def test_graph_nodes(self):
        graph = build_search_graph()
        node_names = set(graph.nodes.keys())
        expected = {"classify_search", "execute_search", "generate_answer"}
        assert expected.issubset(node_names)


class TestCSGraph:
    def test_graph_builds(self):
        graph = build_cs_graph()
        assert graph is not None

    def test_graph_nodes(self):
        graph = build_cs_graph()
        node_names = set(graph.nodes.keys())
        expected = {"classify_intent", "retrieve_knowledge", "generate_response"}
        assert expected.issubset(node_names)


class TestKnowledgeBase:
    def test_knowledge_base_categories(self):
        assert "account" in KNOWLEDGE_BASE
        assert "reading" in KNOWLEDGE_BASE
        assert "payment" in KNOWLEDGE_BASE
        assert "author" in KNOWLEDGE_BASE
        assert "technical" in KNOWLEDGE_BASE

    def test_knowledge_base_content(self):
        account_kb = KNOWLEDGE_BASE["account"]
        assert "register" in account_kb
        assert "login" in account_kb
        assert len(account_kb["register"]) > 0


class TestRecommendService:
    @pytest.mark.asyncio
    async def test_recommend_service_init(self):
        service = RecommendService()
        assert service.graph is not None


class TestSearchService:
    @pytest.mark.asyncio
    async def test_search_service_init(self):
        service = SearchService()
        assert service.graph is not None


class TestCustomerService:
    @pytest.mark.asyncio
    async def test_cs_service_init(self):
        service = CustomerService()
        assert service.graph is not None
