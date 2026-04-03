import time
print("Testing torch import...")
start = time.time()
import torch
print(f"Torch imported in {time.time() - start:.2f} seconds")
print(f"CUDA available: {torch.cuda.is_available()}")
