import logging
from typing import TypedDict, Annotated, List, Dict, Any, Optional
from operator import add

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END

from app.core.llm import get_llm
from app.core.repository import novel_repo
from app.core.vector_store import vector_store
from app.core.context import context_manager, ConversationContext

logger = logging.getLogger(__name__)


class RecommendState(TypedDict):
    messages: Annotated[List[BaseMessage], add]
    user_id: Optional[int]
    user_preference: str
    candidate_books: List[Dict[str, Any]]
    recommendation_reason: str
    final_response: str


RECOMMEND_SYSTEM_PROMPT = """你是一个专业的小说推荐顾问。你的任务是根据用户的阅读偏好和需求，从候选书单中挑选最合适的书籍进行推荐。

推荐原则：
1. 优先匹配用户明确提到的偏好（分类、风格、作者等）
2. 考虑书籍的评分和热度
3. 给出具体、有说服力的推荐理由
4. 每次推荐3-5本书，并说明推荐原因
5. 如果候选书不足，可以结合你的知识补充推荐

请用友好、专业的语气回答，格式清晰。"""

PREFERENCE_EXTRACT_PROMPT = """分析用户的阅读偏好。根据用户的消息，提取以下信息：
- 喜欢的分类/类型
- 喜欢的作者
- 偏好的风格（轻松/严肃/热血/治愈等）
- 其他偏好关键词

用户消息：{user_message}

请用简洁的关键词描述用户的偏好，不要超过50个字。"""

RANK_PROMPT = """根据用户偏好，从以下候选书籍中挑选最合适的3-5本进行推荐。

用户偏好：{preference}

候选书籍：
{candidate_list}

请按推荐优先级排序，并为每本书给出推荐理由。格式如下：
1. 《书名》- 推荐理由
2. 《书名》- 推荐理由
..."""


async def extract_preference(state: RecommendState) -> dict:
    llm = get_llm(temperature=0.3)
    last_message = state["messages"][-1].content if state["messages"] else ""

    response = await llm.ainvoke([
        SystemMessage(content=PREFERENCE_EXTRACT_PROMPT.format(user_message=last_message))
    ])

    preference = response.content.strip()
    return {"user_preference": preference}


async def retrieve_candidates(state: RecommendState) -> dict:
    candidates = []

    if state["user_preference"]:
        try:
            vector_results = vector_store.search(
                query=state["user_preference"],
                n_results=10,
            )
            for r in vector_results:
                book = novel_repo.get_book_by_id(r["book_id"])
                if book:
                    candidates.append(book)
        except Exception as e:
            logger.warning(f"Vector search failed: {e}, falling back to database query")

    if len(candidates) < 5:
        top_books = novel_repo.get_top_rated_books(limit=10)
        existing_ids = {b["id"] for b in candidates}
        for b in top_books:
            if b["id"] not in existing_ids:
                candidates.append(b)

    if state.get("user_id"):
        bookshelf = novel_repo.get_user_bookshelf(state["user_id"])
        bookshelf_ids = {b["id"] for b in bookshelf}
        candidates = [c for c in candidates if c["id"] not in bookshelf_ids]

    return {"candidate_books": candidates[:15]}


async def rank_and_recommend(state: RecommendState) -> dict:
    llm = get_llm(temperature=0.7)

    candidate_list = ""
    for i, book in enumerate(state["candidate_books"], 1):
        candidate_list += (
            f"{i}. 《{book['title']}》- 作者：{book['author']}，"
            f"分类：{book['category']}，评分：{book.get('rating', 0)}，"
            f"简介：{book.get('description', '暂无简介')[:100]}\n"
        )

    response = await llm.ainvoke([
        SystemMessage(content=RECOMMEND_SYSTEM_PROMPT),
        HumanMessage(content=RANK_PROMPT.format(
            preference=state["user_preference"],
            candidate_list=candidate_list,
        )),
    ])

    return {"final_response": response.content}


def build_recommend_graph() -> StateGraph:
    graph = StateGraph(RecommendState)

    graph.add_node("extract_preference", extract_preference)
    graph.add_node("retrieve_candidates", retrieve_candidates)
    graph.add_node("rank_and_recommend", rank_and_recommend)

    graph.set_entry_point("extract_preference")
    graph.add_edge("extract_preference", "retrieve_candidates")
    graph.add_edge("retrieve_candidates", "rank_and_recommend")
    graph.add_edge("rank_and_recommend", END)

    return graph.compile()


recommend_graph = build_recommend_graph()


class RecommendService:
    def __init__(self):
        self.graph = recommend_graph

    async def recommend(
        self,
        message: str,
        session_id: str,
        user_id: Optional[int] = None,
    ) -> str:
        ctx = context_manager.get_context(session_id)
        ctx.module = "recommend"
        ctx.user_id = user_id
        ctx.add_message("user", message)

        try:
            history = ctx.get_history(max_turns=5)
            messages = []
            for m in history[:-1]:
                if m["role"] == "user":
                    messages.append(HumanMessage(content=m["content"]))
                elif m["role"] == "assistant":
                    messages.append(AIMessage(content=m["content"]))

            messages.append(HumanMessage(content=message))

            result = await self.graph.ainvoke({
                "messages": messages,
                "user_id": user_id,
                "user_preference": "",
                "candidate_books": [],
                "recommendation_reason": "",
                "final_response": "",
            })

            response = result["final_response"]
            ctx.add_message("assistant", response)
            context_manager.save_context(ctx)

            return response

        except Exception as e:
            logger.error(f"Recommendation error: {e}", exc_info=True)
            error_msg = f"推荐服务暂时不可用，请稍后再试。错误信息：{str(e)}"
            ctx.add_message("assistant", error_msg)
            context_manager.save_context(ctx)
            return error_msg
