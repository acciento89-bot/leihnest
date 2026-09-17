FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 DATA_DIR=/data LEIHNEST_ENV=production ALLOW_SIGNUP=0
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 leihnest \
    && useradd --uid 10001 --gid 10001 --no-create-home leihnest \
    && mkdir /data && chown 10001:10001 /data
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=10001:10001 app ./app
USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)" || exit 1
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers", "--no-access-log"]
