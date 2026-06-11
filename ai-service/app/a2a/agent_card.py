"""AgentCard definition for novel-ai-agent."""

def build_agent_card(host: str = "localhost", port: int = 8001) -> dict:
    """Build AgentCard as dict for Nacos metadata registration."""
    return {
        "name": "novel-ai-agent",
        "description": "墨语小说 AI 智能助手，提供推荐、搜索、客服和封面生成能力",
        "version": "1.0.0",
        "url": f"http://{host}:{port}",
        "capabilities": {
            "streaming": True,
            "push_notifications": False,
        },
        "default_input_modes": ["text/plain"],
        "default_output_modes": ["text/plain"],
        "skills": [
            {
                "id": "recommend",
                "name": "智能推荐",
                "description": "根据用户偏好和阅读历史，推荐合适的小说",
                "tags": ["ai", "recommend", "streaming"],
            },
            {
                "id": "search",
                "name": "智能搜索",
                "description": "基于语义理解的智能小说搜索",
                "tags": ["ai", "search", "streaming"],
            },
            {
                "id": "customer_service",
                "name": "AI 客服",
                "description": "回答用户关于平台使用、充值、会员等常见问题",
                "tags": ["ai", "customer-service", "streaming"],
            },
            {
                "id": "generate_cover",
                "name": "封面生成",
                "description": "根据书籍信息AI生成封面图片",
                "tags": ["ai", "image-generation"],
            },
        ],
    }
