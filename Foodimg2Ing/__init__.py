from flask import Flask, request, jsonify
from flask_cors import CORS
from Foodimg2Ing.output import output
import os
import traceback

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

@app.route('/api/predict_json', methods=['POST'])
def predict_json():
    try:
        if 'imagefile' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
            
        imagefile = request.files['imagefile']
        temp_dir = os.path.join(app.root_path, '..', 'temp_uploads')
        os.makedirs(temp_dir, exist_ok=True)
        
        image_path = os.path.join(temp_dir, f"api_{imagefile.filename}")
        imagefile.save(image_path)
        
        title, ingredients, recipe = output(image_path)
        
        # Consistent output structure
        result = {
            "title": title[0] if title else "Unknown",
            "ingredients": ingredients[0] if ingredients else [],
            "recipe": recipe[0] if recipe else []
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


print("Initializing CuisineAI API Engine...", flush=True)
print("AI modules successfully loaded.", flush=True)