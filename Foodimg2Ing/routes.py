from flask import request, jsonify
from Foodimg2Ing import app
print("📦 Loading core prediction engine...", flush=True)
from Foodimg2Ing.output import output
print("✅ Core engine ready.", flush=True)
import os
from flask_cors import CORS

# Enable CORS for Next.js frontend
CORS(app)

@app.route('/api/predict', methods=['POST'])
def predict():
    if 'imagefile' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    imagefile = request.files['imagefile']
    
    if imagefile.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    images_dir = os.path.join(app.root_path, 'static', 'images', 'demo_imgs')
    os.makedirs(images_dir, exist_ok=True)
    
    image_path = os.path.join(images_dir, imagefile.filename)
    imagefile.save(image_path)
    
    try:
        title, ingredients, recipe = output(image_path)
        return jsonify({
            "title": title[0] if title else "Unknown",
            "ingredients": ingredients[0] if ingredients else [],
            "recipe": recipe[0] if recipe else [],
            "imageUrl": f"/static/images/demo_imgs/{imagefile.filename}"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sample/<samplefoodname>', methods=['GET'])
def predict_sample(samplefoodname):
    imagefile = os.path.join(app.root_path, 'static', 'images', str(samplefoodname) + ".jpg")
    if not os.path.exists(imagefile):
        return jsonify({"error": "Sample not found"}), 404
        
    try:
        title, ingredients, recipe = output(imagefile)
        return jsonify({
            "title": title[0] if title else "Unknown",
            "ingredients": ingredients[0] if ingredients else [],
            "recipe": recipe[0] if recipe else [],
            "imageUrl": f"/static/images/{samplefoodname}.jpg"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500