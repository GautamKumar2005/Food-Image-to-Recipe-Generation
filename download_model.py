import gdown
import os

def download_file(file_id, output_path):
    if os.path.exists(output_path):
        print(f"✅ {output_path} already exists. Skipping download.")
        return
    
    print(f"⏳ Downloading model file to {output_path}...")
    url = f'https://drive.google.com/uc?id={file_id}'
    gdown.download(url, output_path, quiet=False)

if __name__ == "__main__":
    # Ensure data directory exists
    data_dir = os.path.join("Foodimg2Ing", "data")
    os.makedirs(data_dir, exist_ok=True)
    
    # Model ID provided by user
    model_id = '18YRDmIloykNKqs0IoC9On9ZWShWzBG8V'
    model_path = os.path.join(data_dir, "modelbest.ckpt")
    
    download_file(model_id, model_path)
