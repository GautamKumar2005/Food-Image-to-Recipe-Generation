import sys
import os
import json

# Fix for Unicode/Emoji printing errors on some environments
import io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Setup paths — current_dir is the project root (Food_Recipe_App/)
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

def run_prediction(image_path):
    try:
        print("🔍 Starting prediction...", flush=True)

        if not os.path.exists(image_path):
            return {"error": f"Image file not found: {image_path}"}

        # Pass data_dir explicitly — avoids needing Flask app context
        data_dir = os.path.join(current_dir, "Foodimg2Ing", "data")
        print(f"📂 Data dir: {data_dir}", flush=True)

        from Foodimg2Ing.output import output
        title, ingredients, recipe = output(image_path, data_dir=data_dir)

        # Collect ALL recipe predictions as provided by output.py (even if marked invalid)
        recipes = []

        for i in range(len(title)):
            t = title[i] if i < len(title) else "Not a valid recipe!"
            ing = ingredients[i] if i < len(ingredients) else []
            rec = recipe[i] if i < len(recipe) else ["No recipe provided."]

            recipes.append({
                "title": t,
                "ingredients": ing if isinstance(ing, list) else list(ing),
                "recipe": rec if isinstance(rec, list) else [rec],
            })

        # Primary result is the first prediction
        primary = recipes[0] if recipes else {"title": "Unknown Dish", "ingredients": [], "recipe": []}

        return {
            "title": primary["title"],
            "ingredients": primary["ingredients"],
            "recipe": primary["recipe"],
            "recipes": recipes,          # all predictions as an array
        }

    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("---JSON_START---")
        print(json.dumps({"error": "No image path provided"}))
        print("---JSON_END---")
        sys.exit(1)

    image_path = sys.argv[1]
    result = run_prediction(image_path)

    print("---JSON_START---")
    print(json.dumps(result, ensure_ascii=False))
    print("---JSON_END---")
