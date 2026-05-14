import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.chat import router as chat_router
from app.api.admin import router as admin_router
from app.core.vector_store import vector_store

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI Service starting up...")
    try:
        vector_store.index_books()
        logger.info("Vector store indexing completed")
    except Exception as e:
        logger.warning(f"Vector store indexing failed (will work without vector search): {e}")
    yield
    logger.info("AI Service shutting down...")


app = FastAPI(
    title="小说阅读平台 AI 智能体服务",
    description="基于LangChain和LangGraph的AI智能体系统，包含智能推荐、智能搜索和AI客服三大模块",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/ai", tags=["AI对话"])
app.include_router(admin_router, prefix="/api/ai/admin", tags=["系统管理"])


@app.get("/")
async def root():
    return {
        "service": "Novel AI Agent Service",
        "version": "1.0.0",
        "modules": ["recommend", "search", "customer_service"],
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.AI_SERVICE_PORT,
        reload=True,
    )
