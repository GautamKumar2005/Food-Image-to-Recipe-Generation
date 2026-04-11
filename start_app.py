import sys
import os

# Ensure the parent directory is in the Python path so we can import Foodimg2Ing as a package
sys.path.append(os.path.dirname(__file__))

def main():
    print("=" * 50)
    print("    Food Image to Recipe Web Application")
    print("=" * 50)
    print("Starting Flask server...", flush=True)
    
    try:
        print("Step 1: Pre-import check passed...", flush=True)
        print("Step 2: Loading Foodimg2Ing package (this can take 10-20s)...", flush=True)
        from Foodimg2Ing import app
        print("Step 3: Package loaded successfully.", flush=True)

        # Use environment PORT if available, fallback to 5000
        port = int(os.environ.get("PORT", 5000))
        print(f"Step 4: Starting Flask server on 0.0.0.0:{port}...", flush=True)
        
        # Bind to all interfaces (0.0.0.0) for cloud deployment
        app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
        
    except ImportError as e:
        print(f"Error: Could not import Foodimg2Ing package. {e}")
    except Exception as e:
        print(f"Flask App Error: {e}")

if __name__ == "__main__":
    main()