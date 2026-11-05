
FROM python:3.11-slim

WORKDIR /code

# System dependencies for OCR and PDF processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    git \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face and model cache configuration
ENV HF_HOME=/code/.cache/huggingface
ENV HF_HUB_CACHE=/code/.cache/huggingface/hub
ENV TORCH_HOME=/code/.cache/torch
ENV PYTHONPATH=/code
ENV PYTHONUNBUFFERED=1

# Install Python dependencies
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

# Copy application source
COPY . .

# Start Flask using Gunicorn
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-7860} --workers 1 --timeout 300 --chdir backend app:app"]
