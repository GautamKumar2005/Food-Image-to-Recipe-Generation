# Use a slim Node image as our base
FROM node:18-slim

# 1. Set environment variables
# PIP_BREAK_SYSTEM_PACKAGES=1 bypasses the "externally-managed-environment" error
ENV PIP_BREAK_SYSTEM_PACKAGES=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# 2. Install Python 3, pip, and required system libraries for ML/OpenCV
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 3. Fix python/pip symlinks (using -sf to force overwrite if they exist)
RUN ln -sf /usr/bin/python3 /usr/bin/python && \
    ln -sf /usr/bin/pip3 /usr/bin/pip

WORKDIR /app

# 4. Install Python dependencies first
# This layer is cached unless requirements.txt changes
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# 5. Install Node dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install --legacy-peer-deps

# 6. Copy the full project
COPY . .

# 7. Setup storage/uploads directory
RUN mkdir -p /app/temp_uploads && chmod 777 /app/temp_uploads

# 8. Build the Next.js app 
WORKDIR /app/frontend
# Use dummy variables during build so Next.js doesn't crash
# These will be replaced by your REAL variables in Space Settings at runtime
ENV DATABASE_URL="mongodb://dummy"
ENV NEXTAUTH_SECRET="dummy"
ENV NEXTAUTH_URL="http://localhost:7860"
RUN npm run build

# Final configuration for Hugging Face Spaces (Port 7860 and User 1000)
EXPOSE 7860
ENV PORT=7860
ENV NODE_ENV=production

# Hugging Face Spaces requires running with user ID 1000.
# The node:slim image already has a 'node' user with ID 1000!
# We just need to give it ownership of /app.
RUN chown -R node:node /app
USER node

# Start the Next.js server
CMD ["npm", "start"]