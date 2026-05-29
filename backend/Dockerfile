FROM python:3.12-slim

WORKDIR /app

# WeasyPrint runtime libraries + 日本語フォント(Noto CJK)
RUN apt-get update && apt-get install -y --no-install-recommends \
      libpangocairo-1.0-0 libpango-1.0-0 libpangoft2-1.0-0 \
      libgdk-pixbuf-2.0-0 libcairo2 libffi8 \
      fonts-noto-cjk \
      curl \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV PYTHONUNBUFFERED=1
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=4s --start-period=15s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8000/api/health || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
