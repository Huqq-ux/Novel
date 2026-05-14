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


class SearchState(TypedDict):
    messages: Annotated[List[BaseMessage], add]
    query: str
    search_results: List[Dict[str, Any]]
    search_type: str
    final_response: str


SEARCH_SYSTEM_PROMPT = """你是一个专业的小说搜索助手。你的任务是根据用户的搜索需求，从检索结果中找到最匹配的书籍，并提供详细的介绍。

回答要求：
1. 根据搜索结果，准确回答用户的问题
2. 提供书籍的详细信息（书名、作者、分类、评分、简介等）
3. 如果搜索结果不够精确，可以结合你的知识补充
4. 用清晰、友好的语气回答
5. 如果找不到相关书籍，建议用户尝试其他关键词"""

SEARCH_TYPE_PROMPT = """判断用户的搜索意图类型，从以下选项中选择一个：
- "book_search"：搜索特定书籍（按书名、作者等）
- "category_browse"：浏览某个分类的书籍
- "content_search"：搜索特定内容或主题的书籍
- "comparison"：比较不同书籍
- "general"：一般性查询

用户消息：{user_message}

只返回意图类型，不要其他内容。"""

SEARCH_ANSWER_PROMPT = """根据以下搜索结果，回答用户的问题。

搜索查询：{query}
搜索类型：{search_type}

搜索结果：
{search_results}

用户问题：{user_question}

请提供详细、准确的回答。"""


async def classify_search(state: SearchState) -> dict:
    llm = get_llm(temperature=0.1)
    last_message = state["messages"][-1].content if state["messages"] else ""

    response = await llm.ainvoke([
        SystemMessage(content=SEARCH_TYPE_PROMPT.format(user_message=last_message))
    ])

    search_type = response.content.strip().strip('"').strip("'")
    valid_types = {"book_search", "category_browse", "content_search", "comparison", "general"}
    if search_type not in valid_types:
        search_type = "general"

    return {"search_type": search_type, "query": last_message}


async def execute_search(state: SearchState) -> dict:
    results = []
    query = state["query"]

    try:
        if state["search_type"] == "category_browse":
            categories = novel_repo.get_categories()
            matched_category = None
            for cat in categories:
                if cat in query:
                    matched_category = cat
                    break

            if matched_category:
                results = novel_repo.get_books_by_category(matched_category)
                results = results[:10]
            else:
                vector_results = vector_store.search(query=query, n_results=10)
                for r in vector_results:
                    book = novel_repo.get_book_by_id(r["book_id"])
                    if book:
                        results.append(book)

        elif state["search_type"] == "book_search":
            db_results = novel_repo.search_books(query)
            results = db_results[:10]

            if len(results) < 3:
                vector_results = vector_store.search(query=query, n_results=5)
                existing_ids = {b["id"] for b in results}
                for r in vector_results:
                    book = novel_repo.get_book_by_id(r["book_id"])
                    if book and book["id"] not in existing_ids:
                        results.append(book)

        else:
            vector_results = vector_store.search(query=query, n_results=10)
            for r in vector_results:
                book = novel_repo.get_book_by_id(r["book_id"])
                if book:
                    results.append(book)

            if len(results) < 3:
                db_results = novel_repo.search_books(query)
                existing_ids = {b["id"] for b in results}
                for b in db_results:
                    if b["id"] not in existing_ids:
                        results.append(b)

    except Exception as e:
        logger.warning(f"Search execution failed: {e}, trying database fallback")
        results = novel_repo.search_books(query)[:10]

    return {"search_results": results[:10]}


async def generate_answer(state: SearchState) -> dict:
    llm = get_llm(temperature=0.5)

    search_results_text = ""
    for i, book in enumerate(state["search_results"], 1):
        search_results_text += (
            f"{i}. 《{book['title']}》- 作者：{book['author']}，"
            f"分类：{book['category']}，评分：{book.get('rating', 0)}，"
            f"章节数：{book.get('chapter_count', 0)}，"
            f"简介：{book.get('description', '暂无简介')[:150]}\n"
        )

    if not search_results_text:
        search_results_text = "未找到相关书籍。"

    user_question = state["messages"][-1].content if state["messages"] else state["query"]

    response = await llm.ainvoke([
        SystemMessage(content=SEARCH_SYSTEM_PROMPT),
        HumanMessage(content=SEARCH_ANSWER_PROMPT.format(
            query=state["query"],
            search_type=state["search_type"],
            search_results=search_results_text,
            user_question=user_question,
        )),
    ])

    return {"final_response": response.content}


def build_search_graph() -> StateGraph:
    graph = StateGraph(SearchState)

    graph.add_node("classify_search", classify_search)
    graph.add_node("execute_search", execute_search)
    graph.add_node("generate_answer", generate_answer)

    graph.set_entry_point("classify_search")
    graph.add_edge("classify_search", "execute_search")
    graph.add_edge("execute_search", "generate_answer")
    graph.add_edge("generate_answer", END)

    return graph.compile()


search_graph = build_search_graph()


class SearchService:
    def __init__(self):
        self.graph = search_graph

    async def search(
        self,
        message: str,
        session_id: str,
        user_id: Optional[int] = None,
    ) -> str:
        ctx = context_manager.get_context(session_id)
        ctx.module = "search"
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
                "query": "",
                "search_results": [],
                "search_type": "",
                "final_response": "",
            })

            response = result["final_response"]
            ctx.add_message("assistant", response)
            context_manager.save_context(ctx)

            return response

        except Exception as e:
            logger.error(f"Search error: {e}", exc_info=True)
            error_msg = f"搜索服务暂时不可用，请稍后再试。错误信息：{str(e)}"
            ctx.add_message("assistant", error_msg)
            context_manager.save_context(ctx)
            return error_msg
