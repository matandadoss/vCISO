FROM python:3.11-slim

WORKDIR /app

# Combine system installation and pip requirements into a single layer to leverage caching
COPY requirements.txt .
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt

# Copy the remaining source code
COPY . .

# Enforce production environment to disable mock-tokens in auth.py
ENV ENV=production

# Expose the standard port used by Cloud Run
EXPOSE 8000

# Start the FastAPI server using Uvicorn, respecting the PORT env var
CMD ["sh", "-c", "python scripts/init_db.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
