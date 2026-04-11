# Ensure we are in the project root
cd /app

# 0. Download the ML model if missing
echo "--------------------------------------------------------"
echo "📦 Checking for ML Model Weights..."
echo "--------------------------------------------------------"
python download_model.py

# 1. Start the Flask Backend in the background
echo "--------------------------------------------------------"
echo "🍴 Starting CuisineAI Flask Backend (ML Engine)..."
echo "--------------------------------------------------------"
# BIND to 0.0.0.0:5000 so it's accessible internally by the Frontend
export PORT=5000
python start_app.py &
BACKEND_PID=$!

# 2. Give the model enough time to load (PyTorch models on CPU take 30-45s)
echo "⏳ Waiting for ML engine to initialize (approx 35s)..."
sleep 35

# 3. Start the Next.js Frontend in the foreground
echo "--------------------------------------------------------"
echo "🚀 Starting CuisineAI Next.js Frontend on Port 7860..."
echo "--------------------------------------------------------"
cd frontend
# Hugging Face looks for port 7860 by default
npm start -- -p 7860

# 4. If Next.js exits, handle the cleanup
exit_code=$?
echo "⚠️ Frontend exited with code $exit_code. Cleaning up..."
kill $BACKEND_PID
exit $exit_code
