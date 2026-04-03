import sys
import os
import json
import argparse

# Setup paths
current_dir = os.path.dirname(os.path.abspath(__file__))
# current_dir points to project root Food_Recipe_App
sys.path.append(current_dir)

# Fix for Unicode/Emoji printing errors on some Windows environments
import io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def run_prediction(image_path):
    try:
        # Import the core Flask app to set its root_path before running output
        from Foodimg2Ing import app
        # Ensure it points to the correct subdirectory for 'data', 'static' etc.
        app.root_path = os.path.join(current_dir, "Foodimg2Ing")

        from Foodimg2Ing.output import output
        
        title, ingredients, recipe = output(image_path)
        
        return {
            "title": title[0] if title else "Unknown",
            "ingredients": ingredients[0] if ingredients else [],
            "recipe": recipe[0] if recipe else [],
            "imageUrl": f"/temp_uploads/{os.path.basename(image_path)}"
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("image", help="Path to the image file")
    args = parser.parse_args()
    
    result = run_prediction(args.image)
    print("---JSON_START---")
    print(json.dumps(result))
    print("---JSON_END---")
