FROM python:3.11-slim

WORKDIR /app

# Combine system installation and pip requirements into a single layer to leverage caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the remaining source code
COPY . .

# Expose the standard port used by Cloud Run
EXPOSE 8000

# Start the FastAPI server using Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
