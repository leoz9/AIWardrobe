# Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Build Backend & Runtime
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
# libgomp1 is often needed for onnxruntime/rembg
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend /app/backend

# Copy frontend build artifacts to backend/static
# Assuming 'dist' is the output folder of vite build
COPY --from=frontend-builder /app/frontend/dist /app/backend/static

# Create uploads directory
RUN mkdir -p /app/backend/uploads

WORKDIR /app/backend

# Expose port
EXPOSE 8000

# Run commands
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
