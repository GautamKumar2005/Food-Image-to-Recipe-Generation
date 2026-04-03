from flask import Flask

app = Flask(__name__,template_folder='Templates')


print("🍽️ Initializing CuisineAI app components...", flush=True)
from Foodimg2Ing import routes
print("🍱 Routes and AI modules successfully loaded.", flush=True)