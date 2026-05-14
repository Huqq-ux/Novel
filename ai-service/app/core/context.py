import json
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

import redis
from app.config import settings


@dataclass
class ConversationMessage:
    role: str
    content: str
    timestamp: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ConversationContext:
    session_id: str
    user_id: Optional[int] = None
    module: str = ""
    messages: List[ConversationMessage] = field(default_factory=list)
    intent: Optional[str] = None
    entities: Dict[str, Any] = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)

    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None):
        self.messages.append(
            ConversationMessage(role=role, content=content, metadata=metadata or {})
        )
        self.updated_at = time.time()

    def get_history(self, max_turns: int = 10) -> List[Dict[str, str]]:
        recent = self.messages[-max_turns * 2:]
        return [{"role": m.role, "content": m.content} for m in recent]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "module": self.module,
            "messages": [
                {"role": m.role, "content": m.content, "timestamp": m.timestamp, "metadata": m.metadata}
                for m in self.messages
            ],
            "intent": self.intent,
            "entities": self.entities,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ConversationContext":
        ctx = cls(
            session_id=data["session_id"],
            user_id=data.get("user_id"),
            module=data.get("module", ""),
            intent=data.get("intent"),
            entities=data.get("entities", {}),
            created_at=data.get("created_at", time.time()),
            updated_at=data.get("updated_at", time.time()),
        )
        for m in data.get("messages", []):
            ctx.messages.append(
                ConversationMessage(
                    role=m["role"],
                    content=m["content"],
                    timestamp=m.get("timestamp", time.time()),
                    metadata=m.get("metadata", {}),
                )
            )
        return ctx


class ContextManager:
    CONTEXT_TTL = 3600

    def __init__(self):
        self._redis: Optional[redis.Redis] = None
        self._local_cache: Dict[str, ConversationContext] = {}
        self._redis_available: Optional[bool] = None

    def _get_redis(self) -> Optional[redis.Redis]:
        if self._redis_available is False:
            return None
        if self._redis is None:
            try:
                self._redis = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
                    db=settings.REDIS_DB,
                    decode_responses=True,
                    socket_connect_timeout=3,
                    socket_timeout=3,
                )
                self._redis.ping()
                self._redis_available = True
            except (redis.ConnectionError, redis.TimeoutError, Exception):
                self._redis = None
                self._redis_available = False
                return None
        return self._redis

    def _key(self, session_id: str) -> str:
        return f"ai:context:{session_id}"

    def get_context(self, session_id: str) -> ConversationContext:
        r = self._get_redis()
        if r is not None:
            try:
                data = r.get(self._key(session_id))
                if data:
                    return ConversationContext.from_dict(json.loads(data))
            except (redis.ConnectionError, redis.TimeoutError):
                pass

        if session_id in self._local_cache:
            return self._local_cache[session_id]

        return ConversationContext(session_id=session_id)

    def save_context(self, context: ConversationContext):
        context.updated_at = time.time()
        data = json.dumps(context.to_dict(), ensure_ascii=False)

        r = self._get_redis()
        if r is not None:
            try:
                r.setex(self._key(context.session_id), self.CONTEXT_TTL, data)
            except (redis.ConnectionError, redis.TimeoutError):
                pass

        self._local_cache[context.session_id] = context

    def delete_context(self, session_id: str):
        r = self._get_redis()
        if r is not None:
            try:
                r.delete(self._key(session_id))
            except (redis.ConnectionError, redis.TimeoutError):
                pass

        self._local_cache.pop(session_id, None)


context_manager = ContextManager()
