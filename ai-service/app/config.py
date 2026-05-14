import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # DeepSeek API
    DEEPSEEK_API_KEY: str = os.environ.get("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL: str = "deepseek-v4-pro"

    # Database
    DB_HOST: str = os.environ.get("DB_HOST", "localhost")
    DB_PORT: int = int(os.environ.get("DB_PORT", "3306"))
    DB_NAME: str = os.environ.get("DB_NAME", "novel")
    DB_USER: str = os.environ.get("DB_USER", "root")
    DB_PASSWORD: str = os.environ.get("DB_PASSWORD", "123456")

    # Redis
    REDIS_HOST: str = os.environ.get("REDIS_HOST", "192.168.159.128")
    REDIS_PORT: int = int(os.environ.get("REDIS_PORT", "6379"))
    REDIS_PASSWORD: str = os.environ.get("REDIS_PASSWORD", "123456")
    REDIS_DB: int = 0

    # Service
    AI_SERVICE_PORT: int = int(os.environ.get("AI_SERVICE_PORT", "8001"))

    # ChromaDB
    CHROMA_PERSIST_DIR: str = os.path.join(os.path.dirname(__file__), "chroma_data")

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            f"?charset=utf8mb4"
        )

    @property
    def REDIS_URL(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"


settings = Settings()
