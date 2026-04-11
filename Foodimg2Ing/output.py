# import the necessary libraries
import torch
import torch.nn as nn
import numpy as np
import os
import pickle
import time
from torchvision import transforms
from PIL import Image
from tensorflow.keras.preprocessing import image

from Foodimg2Ing.args import get_parser
from Foodimg2Ing.model import get_model
from Foodimg2Ing.utils.output_utils import prepare_output
from Foodimg2Ing import app

# --- MODEL CACHING ---
# We load the model and vocabs once at the module level for performance.

_predictor_state = {
    'model': None,
    'ingrs_vocab': None,
    'vocab': None,
    'device': None,
    'to_input_transf': None,
    'transform': None
}

def load_predictor():
    if _predictor_state['model'] is not None:
        return _predictor_state

    print("Loading AI Model and Vocabularies into memory...", flush=True)
    data_dir = os.path.join(app.root_path, 'data')
    
    # Setup device
    use_gpu = True
    device = torch.device('cuda' if torch.cuda.is_available() and use_gpu else 'cpu')
    map_loc = None if torch.cuda.is_available() and use_gpu else 'cpu'

    # Load vocabs
    ingrs_vocab = pickle.load(open(os.path.join(data_dir, 'ingr_vocab.pkl'), 'rb'))
    vocab = pickle.load(open(os.path.join(data_dir, 'instr_vocab.pkl'), 'rb'))

    ingr_vocab_size = len(ingrs_vocab)
    instrs_vocab_size = len(vocab)

    # Setup parser and model
    import sys; 
    old_args = sys.argv
    sys.argv = [''] # Mock argv for parser
    args = get_parser()
    sys.argv = old_args # Restore argv
    
    args.maxseqlen = 15
    args.ingrs_only = False
    model = get_model(args, ingr_vocab_size, instrs_vocab_size)
   
    # Load pre-trained weights
    model_path = os.path.join(data_dir, 'modelbest.ckpt')
    model.load_state_dict(torch.load(model_path, map_location=map_loc))
    model.to(device)
    model.eval()
    model.ingrs_only = False
    model.recipe_only = False

    # Transforms
    transf_list_batch = []
    transf_list_batch.append(transforms.ToTensor())
    transf_list_batch.append(transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)))
    to_input_transf = transforms.Compose(transf_list_batch)

    transf_list = []
    transf_list.append(transforms.Resize(256))
    transf_list.append(transforms.CenterCrop(224))
    transform = transforms.Compose(transf_list)

    _predictor_state.update({
        'model': model,
        'ingrs_vocab': ingrs_vocab,
        'vocab': vocab,
        'device': device,
        'to_input_transf': to_input_transf,
        'transform': transform
    })
    
    print("AI Predictor ready.", flush=True)
    return _predictor_state

# Trigger load on first import
# load_predictor() 

def output(uploadedfile):
    state = load_predictor()
    model = state['model']
    ingrs_vocab = state['ingrs_vocab']
    vocab = state['vocab']
    device = state['device']
    to_input_transf = state['to_input_transf']
    transform = state['transform']

    greedy = [True, False]
    beam = [-1, -1]
    temperature = 1.0
    numgens = len(greedy)

    img = image.load_img(uploadedfile)
    show_anyways = False 
    
    image_transf = transform(img)
    image_tensor = to_input_transf(image_transf).unsqueeze(0).to(device)

    title = []
    ingredients = []
    recipe = []

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
            recipe.append("Reason: " + valid['reason'])
            
    return title, ingredients, recipe
