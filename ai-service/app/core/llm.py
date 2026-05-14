from langchain_openai import ChatOpenAI
from app.config import settings


def get_llm(streaming: bool = True, temperature: float = 0.7) -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.DEEPSEEK_MODEL,
        base_url=settings.DEEPSEEK_BASE_URL,
        api_key=settings.DEEPSEEK_API_KEY,
        streaming=streaming,
        temperature=temperature,
    )
