FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/sites-available/default

# Expose port (Hugging Face uses 7860)
EXPOSE 7860

# Start script
COPY start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]