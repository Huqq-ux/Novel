import logging
import random
from urllib.parse import quote

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()

CATEGORY_STYLES = {
    "玄幻": "epic fantasy, ancient Chinese mythology, mystical energies, grand scale, dramatic lighting",
    "仙侠": "Chinese immortal cultivation, ethereal mountain peaks, flowing robes, spiritual energy, celestial light",
    "都市": "modern cityscape, urban life, contemporary setting, neon lights, realistic style",
    "历史": "ancient Chinese dynasty, historical epic, traditional architecture, battle formations",
    "科幻": "sci-fi, futuristic technology, space exploration, cyberpunk elements, cosmic scale",
    "游戏": "game world, virtual reality, fantasy adventure, pixel art influence, action pose",
    "悬疑": "mystery thriller, noir atmosphere, shadows and light, suspense, detective elements",
    "言情": "romantic, elegant, soft lighting, beautiful scenery, emotional atmosphere, warm colors",
    "技术": "technology, digital world, circuit patterns, code aesthetics, futuristic interface",
    "文学": "literary classic, poetic atmosphere, ink wash painting style, elegant composition",
}


class CoverGenerationRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="书名")
    category: str | None = Field(None, description="分类")
    author: str | None = Field(None, description="作者")
    description: str | None = Field(None, max_length=500, description="书籍简介")


def build_prompt(req: CoverGenerationRequest) -> str:
    style = CATEGORY_STYLES.get(req.category, "beautiful book cover, artistic style, elegant composition")
    parts = ["book cover illustration"]

    parts.append(f'title: "{req.title}"')
    parts.append(style)

    if req.author:
        parts.append(f"author: {req.author}")
    if req.description:
        parts.append(f"story: {req.description[:200]}")

    parts.append("vertical orientation, book cover design, high quality, professional illustration")
    parts.append("no text on image, no letters, no typography, no words, clean visual")
    return ", ".join(parts)


@router.post(
    "/generate-cover",
    summary="AI生成书籍封面",
    description="使用 Pollinations.ai 免费生图服务根据书籍信息生成封面，返回图片二进制",
    responses={200: {"content": {"image/jpeg": {}}}},
)
async def generate_cover(req: CoverGenerationRequest):
    prompt = build_prompt(req)
    seed = random.randint(0, 99999)

    encoded = quote(prompt, safe="")
    image_url = (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?model=flux"
        f"&width=800"
        f"&height=1120"
        f"&enhance=true"
        f"&seed={seed}"
        f"&nologo=true"
    )

    logger.info(f"Generating cover for '{req.title}', seed={seed}")

    try:
        async with httpx.AsyncClient(timeout=90.0, follow_redirects=True) as client:
            resp = await client.get(image_url)
            if resp.status_code == 200:
                content_type = resp.headers.get("content-type", "")
                if "image" in content_type:
                    logger.info(f"Cover generated for '{req.title}', size={len(resp.content)} bytes")
                    return Response(
                        content=resp.content,
                        media_type=content_type,
                        headers={
                            "X-Cover-Prompt": prompt,
                            "X-Cover-Seed": str(seed),
                            "X-Cover-URL": image_url,
                        },
                    )
                else:
                    logger.error(f"Unexpected content type: {content_type}")
                    raise HTTPException(status_code=502, detail="Image generation service returned non-image response")
            else:
                logger.error(f"Image generation failed: HTTP {resp.status_code}")
                raise HTTPException(status_code=502, detail=f"Image generation failed: HTTP {resp.status_code}")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Image generation timed out")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cover generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Cover generation failed: {str(e)}")
