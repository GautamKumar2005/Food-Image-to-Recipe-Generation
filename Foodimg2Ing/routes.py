from flask import request, jsonify
from Foodimg2Ing import app
print("📦 Loading core prediction engine...", flush=True)
from Foodimg2Ing.output import output
print("✅ Core engine ready.", flush=True)
import os
from flask_cors import CORS
from PIL import Image
import io

# Enable CORS for Next.js frontend
CORS(app)

# Supported input formats that will be auto-converted to JPEG
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'avif', 'bmp', 'tiff', 'tif', 'gif'}

def allowed_file(filename):
    """Check if the uploaded file has an accepted image extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_to_jpg(file_stream, save_path):
    """
    Convert any supported image format to JPEG (RGB).
    Handles transparency by compositing against a white background.
    Returns the final saved .jpg path.
    """
    img = Image.open(file_stream)

    # Handle animated GIFs — use the first frame only
    if getattr(img, 'is_animated', False):
        img.seek(0)

    # Convert palette or RGBA images: composite onto white background
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
        img = background
    else:
        img = img.convert('RGB')

    img.save(save_path, format='JPEG', quality=95)
    return save_path

@app.route('/api/predict', methods=['POST'])
def predict():
    if 'imagefile' not in request.files:
        return jsonify({"error": "No file part"}), 400

    imagefile = request.files['imagefile']

    if imagefile.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(imagefile.filename):
        return jsonify({
            "error": f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        }), 415

    images_dir = os.path.join(app.root_path, 'static', 'images', 'demo_imgs')
    os.makedirs(images_dir, exist_ok=True)

    # Always save as .jpg regardless of uploaded format
    base_name = os.path.splitext(imagefile.filename)[0]
    jpg_filename = base_name + '.jpg'
    jpg_path = os.path.join(images_dir, jpg_filename)

    try:
        # Read the uploaded file into memory and convert to JPEG
        file_bytes = io.BytesIO(imagefile.read())
        convert_to_jpg(file_bytes, jpg_path)
    except Exception as e:
        return jsonify({"error": f"Image conversion failed: {str(e)}"}), 422

    try:
        title, ingredients, recipe = output(jpg_path)
        return jsonify({
            "title": title[0] if title else "Unknown",
            "ingredients": ingredients[0] if ingredients else [],
            "recipe": recipe[0] if recipe else [],
            "imageUrl": f"/static/images/demo_imgs/{jpg_filename}"
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