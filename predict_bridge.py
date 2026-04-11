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

        # Pick the first valid result
        result_title = "Unknown Dish"
        result_ingredients = []
        result_recipe = []

        for i in range(len(title)):
            t = title[i] if i < len(title) else ""
            ing = ingredients[i] if i < len(ingredients) else []
            rec = recipe[i] if i < len(recipe) else []

            # Skip clearly invalid results
            if t and "Not a valid" not in t and "Error" not in t and len(ing) > 0:
                result_title = t
                result_ingredients = ing if isinstance(ing, list) else list(ing)
                result_recipe = rec if isinstance(rec, list) else [rec]
                break

        # Fallback: use first result regardless
        if result_title == "Unknown Dish" and len(title) > 0:
            result_title = title[0] if title[0] else "Unknown Dish"
            result_ingredients = list(ingredients[0]) if ingredients else []
            result_recipe = list(recipe[0]) if isinstance(recipe[0], list) else [recipe[0]] if recipe else []

        return {
            "title": result_title,
            "ingredients": result_ingredients,
            "recipe": result_recipe,
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
