import json
import logging
from pathlib import Path
from typing import TypedDict, Annotated, List, Dict, Any, Optional, Literal
from operator import add

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END

from app.core.llm import get_llm
from app.core.repository import novel_repo
from app.core.context import context_manager, ConversationContext

logger = logging.getLogger(__name__)

# Load knowledge base from external JSON file
_kb_path = Path(__file__).parent.parent / "data" / "knowledge_base.json"
with open(_kb_path, "r", encoding="utf-8") as f:
    KNOWLEDGE_BASE = json.load(f)


class CustomerServiceState(TypedDict):
    messages: Annotated[List[BaseMessage], add]
    user_id: Optional[int]
    intent: str
    entities: Dict[str, Any]
    knowledge_response: str
    final_response: str


CS_SYSTEM_PROMPT = """你是"小说阅读平台"的AI客服助手，名叫"小阅"。你的职责是帮助用户解决使用平台时遇到的问题，也可以用你的通用知识回答与阅读、书籍、文学相关的问题。

你的服务范围：
1. 账号问题：注册、登录、密码重置、账号安全
2. 阅读功能：如何搜索书籍、加入书架、阅读章节、调整设置
3. 付费相关：书币充值、付费章节解锁、退款政策
4. 作者功能：如何成为作者、发布作品、管理章节
5. 平台规则：社区规范、评论规则、版权说明
6. 技术支持：页面加载问题、APP使用问题

回答要求：
- 语气友好、耐心、专业
- 先确认用户的问题，再给出解决方案
- 参考知识库的信息优先使用，知识库没有覆盖的内容，可以用你的通用知识补充
- 对于平台操作类问题（充值、成为作者等），尽量给出具体步骤
- 如果确实无法解答，建议联系人工客服"""

INTENT_CLASSIFY_PROMPT = """判断用户的问题意图，从以下选项中选择最匹配的一个：
- "account"：账号相关问题（登录、注册、密码、安全）
- "reading"：阅读功能问题（搜索、书架、章节、阅读设置）
- "payment"：付费相关问题（充值、解锁、退款、书币）
- "author"：作者相关问题（申请、发布、管理）
- "technical"：技术问题（页面加载、APP问题、错误提示）
- "feedback"：意见反馈或投诉
- "greeting"：问候或闲聊
- "other"：其他问题

用户消息：{user_message}

只返回意图类型，不要其他内容。"""



async def classify_intent(state: CustomerServiceState) -> dict:
    llm = get_llm(temperature=0.1)
    last_message = state["messages"][-1].content if state["messages"] else ""

    response = await llm.ainvoke([
        SystemMessage(content=INTENT_CLASSIFY_PROMPT.format(user_message=last_message))
    ])

    intent = response.content.strip().strip('"').strip("'").lower()
    valid_intents = {"account", "reading", "payment", "author", "technical", "feedback", "greeting", "other"}
    if intent not in valid_intents:
        intent = "other"

    return {"intent": intent}


async def retrieve_knowledge(state: CustomerServiceState) -> dict:
    intent = state["intent"]
    knowledge = KNOWLEDGE_BASE.get(intent, {})
    last_message = state["messages"][-1].content if state["messages"] else ""

    if intent == "greeting":
        return {"knowledge_response": "用户打招呼，请友好回应。"}

    if not knowledge:
        return {"knowledge_response": "知识库暂无此分类信息，请根据通用知识回答。"}

    llm = get_llm(temperature=0.3)
    knowledge_text = "\n".join(f"- {k}：{v}" for k, v in knowledge.items())

    response = await llm.ainvoke([
        SystemMessage(content=f"根据以下知识库内容，提取与用户问题最相关的信息。\n\n知识库：\n{knowledge_text}\n\n用户问题：{last_message}\n\n请提取相关信息，如无匹配则返回'无匹配信息'。")
    ])

    return {"knowledge_response": response.content}


async def generate_cs_response(state: CustomerServiceState) -> dict:
    llm = get_llm(temperature=0.7)

    history = []
    for msg in state["messages"][:-1]:
        history.append(msg)
    history.append(state["messages"][-1])

    context_info = ""
    if state["user_id"]:
        user = novel_repo.get_user_info(state["user_id"])
        if user:
            context_info = f"\n当前用户信息：用户名-{user.get('username', '未知')}"

    knowledge = state["knowledge_response"]
    system_content = CS_SYSTEM_PROMPT
    if context_info:
        system_content += f"\n{context_info}"
    if knowledge and knowledge != "知识库中暂无相关内容，请根据通用知识回答。" and knowledge != "知识库暂无此分类信息，请根据通用知识回答。":
        system_content += f"\n\n参考知识：{knowledge}"

    messages = [SystemMessage(content=system_content)] + list(history)
    response = await llm.ainvoke(messages)

    return {"final_response": response.content}


def build_cs_graph() -> StateGraph:
    graph = StateGraph(CustomerServiceState)

    graph.add_node("classify_intent", classify_intent)
    graph.add_node("retrieve_knowledge", retrieve_knowledge)
    graph.add_node("generate_response", generate_cs_response)

    graph.set_entry_point("classify_intent")
    graph.add_edge("classify_intent", "retrieve_knowledge")
    graph.add_edge("retrieve_knowledge", "generate_response")
    graph.add_edge("generate_response", END)

    return graph.compile()


cs_graph = build_cs_graph()


class CustomerService:
    def __init__(self):
        self.graph = cs_graph

    async def chat(
        self,
        message: str,
        session_id: str,
        user_id: Optional[int] = None,
    ) -> str:
        ctx = context_manager.get_context(session_id)
        ctx.module = "customer_service"
        ctx.user_id = user_id
        ctx.add_message("user", message)

        try:
            history = ctx.get_history(max_turns=10)
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
                "intent": "",
                "entities": {},
                "knowledge_response": "",
                "final_response": "",
            })

            response = result["final_response"]
            ctx.intent = result.get("intent", "")
            ctx.add_message("assistant", response)
            context_manager.save_context(ctx)

            return response

        except Exception as e:
            logger.error(f"Customer service error: {e}", exc_info=True)
            error_msg = "抱歉，客服系统暂时不可用，请稍后再试或联系人工客服。"
            ctx.add_message("assistant", error_msg)
            context_manager.save_context(ctx)
            return error_msg
