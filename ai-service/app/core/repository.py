from typing import List, Optional, Dict, Any
from sqlalchemy import text
from app.core.database import SessionLocal


class NovelRepository:
    def get_all_books(self) -> List[Dict[str, Any]]:
        with SessionLocal() as db:
            result = db.execute(text(
                "SELECT id, title, author, category, description, rating, "
                "click_count, collect_count, chapter_count, is_finished "
                "FROM books WHERE status IS NULL OR status = 1"
            ))
            return [dict(row._mapping) for row in result.fetchall()]

    def get_book_by_id(self, book_id: int) -> Optional[Dict[str, Any]]:
        with SessionLocal() as db:
            result = db.execute(text(
                "SELECT id, title, author, category, description, rating, "
                "click_count, collect_count, chapter_count, is_finished "
                "FROM books WHERE id = :id"
            ), {"id": book_id})
            row = result.fetchone()
            return dict(row._mapping) if row else None

    def get_books_by_category(self, category: str) -> List[Dict[str, Any]]:
        with SessionLocal() as db:
            result = db.execute(text(
                "SELECT id, title, author, category, description, rating, "
                "click_count, collect_count, chapter_count, is_finished "
                "FROM books WHERE category = :category"
            ), {"category": category})
            return [dict(row._mapping) for row in result.fetchall()]

    def get_chapters_by_book(self, book_id: int) -> List[Dict[str, Any]]:
        with SessionLocal() as db:
            result = db.execute(text(
                "SELECT id, book_id, title, order_num, word_count "
                "FROM chapters WHERE book_id = :book_id ORDER BY order_num"
            ), {"book_id": book_id})
            return [dict(row._mapping) for row in result.fetchall()]

    def get_chapter_content(self, chapter_id: int) -> Optional[Dict[str, Any]]:
        with SessionLocal() as db:
            result = db.execute(text(
                "SELECT id, book_id, title, content, order_num, word_count "
                "FROM chapters WHERE id = :id"
            ), {"id": chapter_id})
            row = result.fetchone()
            return dict(row._mapping) if row else None

    def get_user_bookshelf(self, user_id: int) -> List[Dict[str, Any]]:
        with SessionLocal() as db:
            result = db.execute(text(
                "SELECT b.id, b.title, b.author, b.category, b.description, b.rating, "
                "bs.last_read_time, bs.read_progress "
                "FROM bookshelf bs JOIN books b ON bs.book_id = b.id "
                "WHERE bs.user_id = :user_id ORDER BY bs.last_read_time DESC"
            ), {"user_id": user_id})
            return [dict(row._mapping) for row in result.fetchall()]

    def get_user_info(self, user_id: int) -> Optional[Dict[str, Any]]:
        with SessionLocal() as db:
            result = db.execute(text(
                "SELECT id, username, email, gender, age FROM users WHERE id = :id"
            ), {"id": user_id})
            row = result.fetchone()
            return dict(row._mapping) if row else None

    def search_books(self, keyword: str) -> List[Dict[str, Any]]:
        with SessionLocal() as db:
            result = db.execute(text(
                "SELECT id, title, author, category, description, rating, "
                "click_count, collect_count, chapter_count, is_finished "
                "FROM books WHERE title LIKE :kw OR author LIKE :kw "
                "OR description LIKE :kw OR category LIKE :kw"
            ), {"kw": f"%{keyword}%"})
            return [dict(row._mapping) for row in result.fetchall()]

    def get_categories(self) -> List[str]:
        with SessionLocal() as db:
            result = db.execute(text("SELECT DISTINCT category FROM books"))
            return [row[0] for row in result.fetchall()]

    def get_top_rated_books(self, limit: int = 10) -> List[Dict[str, Any]]:
        with SessionLocal() as db:
            result = db.execute(text(
                "SELECT id, title, author, category, description, rating, "
                "click_count, collect_count FROM books "
                "ORDER BY rating DESC, collect_count DESC LIMIT :limit"
            ), {"limit": limit})
            return [dict(row._mapping) for row in result.fetchall()]

    def get_popular_books(self, limit: int = 10) -> List[Dict[str, Any]]:
        with SessionLocal() as db:
            result = db.execute(text(
                "SELECT id, title, author, category, description, rating, "
                "click_count, collect_count FROM books "
                "ORDER BY click_count DESC, collect_count DESC LIMIT :limit"
            ), {"limit": limit})
            return [dict(row._mapping) for row in result.fetchall()]


novel_repo = NovelRepository()
