FROM python:3.11-slim

WORKDIR /app

# 使用阿里云 PyPI 镜像
RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && \
    pip config set global.trusted-host mirrors.aliyun.com

# 下载 BGE 模型（ModelScope 国内加速）
RUN pip install modelscope && \
    python -c "from modelscope import snapshot_download; snapshot_download('BAAI/bge-small-zh-v1.5', local_dir='/app/bge-model')" && \
    pip uninstall -y modelscope

# 从本地 wheel 安装 PyTorch CPU 版（预下载好，避免境外下载超时）
COPY wheels/torch-*.whl /tmp/
RUN pip install --no-cache-dir /tmp/torch-*.whl && rm /tmp/torch-*.whl

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

ENV BGE_MODEL_PATH=/app/bge-model
ENV PYTHONUNBUFFERED=1

EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
