FROM python:3.11-slim

# DevSecOps Pillar 2: Create a restricted non-root group and user to prevent OS privilege escalation
RUN addgroup --system appgroup && adduser --system --group appuser

WORKDIR /app

# Combine system installation and pip requirements into a single layer to leverage caching
COPY requirements.txt .
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt

# Copy the remaining source code
COPY . .

# DevSecOps Pillar 2: Downgrade ownership of the codebase away from Root
RUN chown -R appuser:appgroup /app

# DevSecOps Pillar 3: Export correct environment flag to trigger Tier 2 API JWT protections
ENV ENV=production

# Expose the standard port used by Cloud Run
EXPOSE 8000

# DevSecOps Pillar 2: Lock the container execution securely into the non-privileged user sandbox
USER appuser

# Start the FastAPI server using Uvicorn, respecting the PORT env var
CMD ["sh", "-c", "python scripts/init_db.py && python scripts/alter_vendors_hierarchy.py && python scripts/alter_threat_actors.py && python scripts/backfill_vendors.py && python scripts/seed_demo_data.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
