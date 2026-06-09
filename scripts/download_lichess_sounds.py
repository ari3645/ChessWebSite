import urllib.request
import os
import shutil

def is_audio_valid(file_path):
    """Vérifie si le fichier est un vrai binaire (pas un lien texte GitHub)."""
    if not os.path.exists(file_path):
        return False
    size = os.path.getsize(file_path)
    if size < 200: # Un MP3 fait rarement moins de 200 octets
        return False
    return True

def download_sounds():
    base_url = "https://github.com/lichess-org/lila/raw/master/public/sound/standard/"
    
    # Mapping des sons avec priorité
    # Si le premier échoue ou est un "faux" fichier, on essaye le suivant
    sound_configs = {
        "move.mp3": ["Move.mp3"],
        "capture.mp3": ["Capture.mp3"],
        "check.mp3": ["Check.mp3", "GenericNotify.mp3", "Move.mp3"],
        "castle.mp3": ["Castle.mp3", "Move.mp3"],
        "promote.mp3": ["Promote.mp3", "GenericNotify.mp3", "Move.mp3"],
        "game_over.mp3": ["Victory.mp3", "GenericNotify.mp3", "Move.mp3"]
    }
    
    target_dir = os.path.join("assets", "sounds")
    os.makedirs(target_dir, exist_ok=True)
    
    print("--- Installation des sons réalistes ---")
    
    for local_name, remote_options in sound_configs.items():
        success = False
        for remote_name in remote_options:
            url = base_url + remote_name
            target_path = os.path.join(target_dir, local_name)
            
            try:
                # Téléchargement temporaire pour vérification
                urllib.request.urlretrieve(url, target_path)
                
                if is_audio_valid(target_path):
                    print(f"[OK] {local_name} (depuis {remote_name})")
                    success = True
                    break
                else:
                    # C'est un pointeur texte, on essaye de lire le contenu pour rediriger
                    with open(target_path, 'r') as f:
                        content = f.read().strip()
                    
                    if content.endswith(".mp3"):
                        # Si c'est un lien relatif comme "../Silence.mp3"
                        if content.startswith("../"):
                            new_url = "https://github.com/lichess-org/lila/raw/master/public/sound/" + content.replace("../", "")
                        else:
                            new_url = base_url + content
                        
                        urllib.request.urlretrieve(new_url, target_path)
                        if is_audio_valid(target_path):
                            print(f"[OK] {local_name} (redirection vers {content})")
                            success = True
                            break
            except Exception:
                continue
        
        if not success:
            # Si tout échoue, on copie le son de mouvement s'il existe
            move_path = os.path.join(target_dir, "move.mp3")
            if local_name != "move.mp3" and os.path.exists(move_path):
                shutil.copy(move_path, os.path.join(target_dir, local_name))
                print(f"[Fallback] {local_name} (copie de move.mp3)")
            else:
                print(f"[ERREUR] Impossible de trouver un son pour {local_name}")

    # Nettoyage final des .wav
    for file in os.listdir(target_dir):
        if file.endswith(".wav"):
            os.remove(os.path.join(target_dir, file))

    print("\nInstallation terminée. Relance le jeu !")

if __name__ == "__main__":
    download_sounds()

if __name__ == "__main__":
    download_sounds()
