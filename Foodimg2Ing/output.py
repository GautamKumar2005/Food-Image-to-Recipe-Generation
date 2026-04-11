import os
# Fix for potential OpenMP/MKL conflict hangs
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'

print("🧪   (a) Loading PyTorch...", flush=True)
import torch
import torch.nn as nn
print("🧪   (b) PyTorch initialized.", flush=True)

print("🧪   (c) Loading Matplotlib...", flush=True)
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
print("🧪   (d) Matplotlib initialized.", flush=True)

print("🧪   (e) Loading NumPy/OS/Args...", flush=True)
import numpy as np

from Foodimg2Ing.args import get_parser
import pickle

print("🧪   (f) Loading AI Models...", flush=True)
from Foodimg2Ing.model import get_model
from torchvision import transforms
from Foodimg2Ing.utils.output_utils import prepare_output
from PIL import Image
import time
print("✨   All prediction modules imported.", flush=True)


def output(uploadedfile, data_dir=None):
    """
    Run inference on an image and return title, ingredients, and recipe.
    
    Args:
        uploadedfile: Path to the uploaded image file.
        data_dir: Path to the data directory containing vocab + model files.
                  If None, falls back to using the Flask app root_path.
    """

    # Resolve data directory
    if data_dir is None:
        from Foodimg2Ing import app
        data_dir = os.path.join(app.root_path, 'data')

    print(f"📂 Using data_dir: {data_dir}", flush=True)

    # Use GPU if available
    use_gpu = True
    device = torch.device('cuda' if torch.cuda.is_available() and use_gpu else 'cpu')
    map_loc = None if torch.cuda.is_available() and use_gpu else 'cpu'
    print(f"⚙️  Device: {device}", flush=True)

    # Load vocabulary files
    ingrs_vocab = pickle.load(open(os.path.join(data_dir, 'ingr_vocab.pkl'), 'rb'))
    vocab = pickle.load(open(os.path.join(data_dir, 'instr_vocab.pkl'), 'rb'))

    ingr_vocab_size = len(ingrs_vocab)
    instrs_vocab_size = len(vocab)

    t = time.time()
    args = get_parser([])
    args.maxseqlen = 15
    args.ingrs_only = False
    model = get_model(args, ingr_vocab_size, instrs_vocab_size)

    # Download model if not present
    model_path = os.path.join(data_dir, 'modelbest.ckpt')
    if not os.path.exists(model_path):
        print("📥 Model not found locally. Downloading from Google Drive...", flush=True)
        import gdown
        drive_url = 'https://drive.google.com/uc?id=18YRDmIloykNKqs0IoC9On9ZWShWzBG8V'
        try:
            gdown.download(drive_url, model_path, quiet=False)
            print("✅ Model downloaded successfully.", flush=True)
        except Exception as e:
            print(f"❌ Error downloading model: {e}", flush=True)
            return ["Model Download Error!"], [], [f"Could not download model: {e}"]

    print("📦 Loading model weights...", flush=True)
    model.load_state_dict(torch.load(model_path, map_location=map_loc))
    model.to(device)
    model.eval()
    model.ingrs_only = False
    model.recipe_only = False
    print(f"✅ Model loaded in {time.time() - t:.1f}s", flush=True)

    # Image normalization transforms
    to_input_transf = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225))
    ])

    # Use greedy + beam search to generate two high-quality recipe candidates.
    # Greedy is fast and reliable; Beam search adds variety.
    greedy = [True, False]
    beam = [-1, 5]
    temperature = 1.0

    # Validate the input file
    if not os.path.exists(uploadedfile):
        return ["File Not Found!"], [], ["Please check the file path."]

    try:
        img = Image.open(uploadedfile).convert('RGB')
        print(f"🖼️  Image loaded: {uploadedfile}", flush=True)
    except Exception as e:
        return ["Invalid Image!"], [], [f"Could not read image: {e}"]

    # ── Aspect-Ratio Preserving Resize with Padding ──────────────────
    # This prevents the food from looking "squashed" or "stretched"
    # and ensures the model sees the entire photo.
    def pad_resize(image, size=224):
        w, h = image.size
        # Resize longest side to 'size'
        if w > h:
            new_w, new_h = size, int(h * size / w)
        else:
            new_w, new_h = int(w * size / h), size
        
        image = image.resize((new_w, new_h), Image.BICUBIC)
        # Pad to make it square
        new_img = Image.new("RGB", (size, size), (0, 0, 0))
        new_img.paste(image, ((size - new_w) // 2, (size - new_h) // 2))
        return new_img

    image_transf = pad_resize(img, 224)
    image_tensor = to_input_transf(image_transf).unsqueeze(0).to(device)

    title = []
    ingredients = []
    recipe = []

    show_anyways = False  # Only keep "Best of Best" quality

    # We use high-quality Beam search for the variants
    greedy = [True, False]
    beam = [-1, 5] 
    temperatures = [1.0, 1.0]
    
    for i in range(len(greedy)):
        with torch.no_grad():
            outputs = model.sample(
                image_tensor,
                greedy=greedy[i],
                temperature=temperatures[i],
                beam=beam[i],
                true_ingrs=None
            )

        ingr_ids = outputs['ingr_ids'].cpu().numpy()
        recipe_ids = outputs['recipe_ids'].cpu().numpy()

        outs, valid = prepare_output(recipe_ids[0], ingr_ids[0], ingrs_vocab, vocab)

        if valid['is_valid']:
            # Prevent exact duplicate titles
            if outs['title'] not in title:
                title.append(outs['title'])
                ingredients.append(outs['ingrs'])
                recipe.append(outs['recipe'])
        elif i == 0:
            # If even the best result is "invalid" but technically complete, 
            # we show it as a fallback but skip the 2nd variant.
            title.append(outs['title'])
            ingredients.append(outs['ingrs'])
            recipe.append(outs['recipe'])

    print(f"🍽️  Prediction done: {title}", flush=True)
    return title, ingredients, recipe
