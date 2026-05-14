from fastapi import APIRouter
from app.core.vector_store import vector_store
from app.core.database import engine
from sqlalchemy import text

router = APIRouter()


@router.get("/health", summary="健康检查")
async def health_check():
    checks = {"service": "ok"}

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {str(e)}"

    try:
        vector_store._ensure_init()
        count = vector_store._collection.count() if vector_store._collection else 0
        checks["vector_store"] = f"ok ({count} documents)"
    except Exception as e:
        checks["vector_store"] = f"error: {str(e)}"

    status_code = 200 if all("ok" in str(v) for v in checks.values()) else 503
    return {"status": "healthy" if status_code == 200 else "degraded", "checks": checks}


@router.post("/index", summary="重建向量索引")
async def rebuild_index():
    try:
        vector_store.index_books()
        return {"message": "索引构建完成", "document_count": vector_store._collection.count()}
    except Exception as e:
        return {"message": f"索引构建失败：{str(e)}"}
