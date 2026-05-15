import json
import logging
from typing import List, Optional, Dict, Any

import chromadb
from chromadb.utils import embedding_functions

from app.config import settings
from app.core.repository import novel_repo

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self):
        self._client: Optional[chromadb.PersistentClient] = None
        self._collection = None
        self._initialized = False

    def _ensure_init(self):
        if self._initialized:
            return
        self._client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)

        self._embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=settings.BGE_MODEL_PATH,
        )

        self._collection = self._client.get_or_create_collection(
            name="novel_books",
            embedding_function=self._embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )
        self._initialized = True

    def index_books(self):
        self._ensure_init()
        try:
            books = novel_repo.get_all_books()
        except Exception as e:
            logger.warning(f"Failed to fetch books from database: {e}")
            return

        if not books:
            logger.warning("No books found in database for indexing")
            return

        existing_ids = set(self._collection.get()["ids"]) if self._collection.count() > 0 else set()

        ids = []
        documents = []
        metadatas = []

        for book in books:
            book_id = str(book["id"])
            if book_id in existing_ids:
                continue

            doc_text = self._build_book_text(book)
            ids.append(book_id)
            documents.append(doc_text)
            metadatas.append({
                "title": book.get("title", ""),
                "author": book.get("author", ""),
                "category": book.get("category", ""),
                "rating": str(book.get("rating", 0)),
            })

        if ids:
            batch_size = 6
            for i in range(0, len(ids), batch_size):
                batch_ids = ids[i:i + batch_size]
                batch_docs = documents[i:i + batch_size]
                batch_metas = metadatas[i:i + batch_size]
                self._collection.add(
                    ids=batch_ids,
                    documents=batch_docs,
                    metadatas=batch_metas,
                )
            logger.info(f"Indexed {len(ids)} new books into vector store")

    def search(
        self,
        query: str,
        n_results: int = 5,
        category_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        self._ensure_init()

        where_filter = None
        if category_filter:
            where_filter = {"category": category_filter}

        try:
            results = self._collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where_filter,
                include=["documents", "metadatas", "distances"],
            )
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []

        if not results["ids"][0]:
            return []

        search_results = []
        for i, doc_id in enumerate(results["ids"][0]):
            search_results.append({
                "book_id": int(doc_id),
                "content": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "distance": results["distances"][0][i],
            })
        return search_results

    def _build_book_text(self, book: Dict[str, Any]) -> str:
        parts = [
            f"书名：{book.get('title', '')}",
            f"作者：{book.get('author', '')}",
            f"分类：{book.get('category', '')}",
            f"评分：{book.get('rating', 0)}",
            f"简介：{book.get('description', '')}",
            f"章节数：{book.get('chapter_count', 0)}",
            f"完结状态：{'已完结' if book.get('is_finished') else '连载中'}",
        ]
        return "\n".join(parts)


vector_store = VectorStore()
