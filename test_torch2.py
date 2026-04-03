import os
import time

print("Setting env limits...")
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'

print("Importing torch...")
start = time.time()
import torch
print(f"Torch imported! Time taken: {time.time()-start:.2f}s")
print(f"Cuda avail: {torch.cuda.is_available()}")
