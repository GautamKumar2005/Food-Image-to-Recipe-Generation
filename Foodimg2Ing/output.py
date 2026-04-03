import os
# Fix for potential OpenMP/MKL conflict hangs on Windows
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
import os

from Foodimg2Ing.args import get_parser
import pickle

print("🧪   (f) Loading AI Models...", flush=True)
from Foodimg2Ing.model import get_model
from torchvision import transforms
from Foodimg2Ing.utils.output_utils import prepare_output
from PIL import Image
import time
from Foodimg2Ing import app
print("✨   All prediction modules imported.", flush=True)


def output(uploadedfile):

    # Keep all the codes and pre-trained weights in data directory
    data_dir=os.path.join(app.root_path,'data')


    # code will run in gpu if available and if the flag is set to True, else it will run on cpu
    use_gpu = True
    device = torch.device('cuda' if torch.cuda.is_available() and use_gpu else 'cpu')
    map_loc = None if torch.cuda.is_available() and use_gpu else 'cpu'



    # code below was used to save vocab files so that they can be loaded without Vocabulary class
    ingrs_vocab = pickle.load(open(os.path.join(data_dir, 'ingr_vocab.pkl'), 'rb'))
    vocab = pickle.load(open(os.path.join(data_dir, 'instr_vocab.pkl'), 'rb'))

    ingr_vocab_size = len(ingrs_vocab)
    instrs_vocab_size = len(vocab)
    output_dim = instrs_vocab_size

    

    t = time.time()
    args = get_parser([])
    args.maxseqlen = 15
    args.ingrs_only=False
    model=get_model(args, ingr_vocab_size, instrs_vocab_size)
   
    # Load the pre-trained model parameters
    model_path = os.path.join(data_dir, 'modelbest.ckpt')
    
    if not os.path.exists(model_path):
        print("📥 Model not found locally. Downloading from Google Drive...", flush=True)
        import gdown
        drive_url = 'https://drive.google.com/uc?id=18YRDmIloykNKqs0IoC9On9ZWShWzBG8V'
        try:
            gdown.download(drive_url, model_path, quiet=False)
            print("✅ Model downloaded successfully.", flush=True)
        except Exception as e:
            print(f"❌ Error downloading model: {e}")
            return ["Model Error!"], [], ["Could not load model files."]

    model.load_state_dict(torch.load(model_path, map_location=map_loc))
    model.to(device)
    model.eval()
    model.ingrs_only = False
    model.recipe_only = False
   


    transf_list_batch = []
    transf_list_batch.append(transforms.ToTensor())
    transf_list_batch.append(transforms.Normalize((0.485, 0.456, 0.406), 
                                                (0.229, 0.224, 0.225)))
    to_input_transf = transforms.Compose(transf_list_batch)

    greedy = [True, False]
    beam = [-1, -1]
    temperature = 1.0
    numgens = len(greedy)

    uploaded_file=uploadedfile

    if not os.path.exists(uploaded_file):
        return ["File Not Found!"], [], ["Please check the file path."]
        
    try:
        img = Image.open(uploaded_file).convert('RGB')
    except Exception as e:
        print(f"Error opening image: {e}")
        return ["Invalid Image!"], [], [f"Could not read image: {e}"]
    
    show_anyways = False #if True, it will show the recipe even if it's not valid
    transf_list = []
    transf_list.append(transforms.Resize(256))
    transf_list.append(transforms.CenterCrop(224))
    transform = transforms.Compose(transf_list)
    
    image_transf = transform(img)
    image_tensor = to_input_transf(image_transf).unsqueeze(0).to(device)

    num_valid = 1
    title=[]
    ingredients=[]
    recipe=[]
    for i in range(numgens):
        with torch.no_grad():
            outputs = model.sample(image_tensor, greedy=greedy[i], 
                                temperature=temperature, beam=beam[i], true_ingrs=None)
                
        ingr_ids = outputs['ingr_ids'].cpu().numpy()
        recipe_ids = outputs['recipe_ids'].cpu().numpy()
                
        outs, valid = prepare_output(recipe_ids[0], ingr_ids[0], ingrs_vocab, vocab)
            
        if valid['is_valid'] or show_anyways:
                
            title.append(outs['title'])

            ingredients.append(outs['ingrs'])

            recipe.append(outs['recipe'])
            

        else:
            title.append("Not a valid recipe!")
            recipe.append("Reason: "+valid['reason'])
            
    return title,ingredients,recipe
