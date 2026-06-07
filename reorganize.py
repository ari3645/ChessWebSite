import os
import shutil

# 1. Créer les dossiers
dirs = ["src", "assets/images", "docs", "tests"]
for d in dirs:
    os.makedirs(d, exist_ok=True)

# 2. Déplacer les fichiers source
src_files = ["board.py", "constants.py", "game_controller.py", "renderer.py"]
for f in src_files:
    if os.path.exists(f):
        shutil.move(f, os.path.join("src", f))

# 3. Déplacer les images
image_dir = "Image"
if os.path.exists(image_dir):
    for f in os.listdir(image_dir):
        shutil.move(os.path.join(image_dir, f), os.path.join("assets/images", f))
    os.rmdir(image_dir)

# 4. Déplacer les docs
doc_files = ["PLAN_DEVELOPPEMENT.md", "plan_test.md"]
for f in doc_files:
    if os.path.exists(f):
        shutil.move(f, os.path.join("docs", f))

# 5. Déplacer les tests
test_file = "test/test_board.py"
if os.path.exists(test_file):
    shutil.move(test_file, os.path.join("tests", "test_board.py"))
    if os.path.exists("test"):
        shutil.rmtree("test")

# 6. Créer les __init__.py
open("src/__init__.py", "a").close()
open("tests/__init__.py", "a").close()

print("Réorganisation terminée avec succès.")
