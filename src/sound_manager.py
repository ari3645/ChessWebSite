import pygame
import os

class SoundManager:
    def __init__(self):
        if not pygame.mixer.get_init():
            pygame.mixer.init()
        
        self.sounds = {}
        self.enabled = True
        self.load_sounds()

    def load_sounds(self):
        # On définit les sons et on cherche d'abord le .mp3 (plus réaliste) puis le .wav
        sound_names = ['move', 'capture', 'check', 'castle', 'promote', 'game_over']
        
        for name in sound_names:
            found = False
            for ext in ['.mp3', '.wav']:
                filename = f"{name}{ext}"
                path = os.path.join("assets", "sounds", filename)
                if os.path.exists(path):
                    try:
                        self.sounds[name] = pygame.mixer.Sound(path)
                        found = True
                        break # On a trouvé une version, on s'arrête
                    except Exception as e:
                        print(f"Erreur de chargement du son {path}: {e}")
            
            if not found:
                print(f"Son non trouvé pour l'action : {name}")

    def play(self, name):
        if self.enabled and name in self.sounds:
            self.sounds[name].play()

    def toggle(self):
        self.enabled = not self.enabled
        return self.enabled
