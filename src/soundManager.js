export class SoundManager {
    constructor() {
        this.enabled = true;
        this.ctx = null;
        this.sounds = {};
        
        // Liste des fichiers locaux
        this.soundNames = ['move', 'capture', 'check', 'castle', 'promote', 'game_over'];
        this.loadLocalSounds();
    }

    loadLocalSounds() {
        this.soundNames.forEach(name => {
            const audio = new Audio();
            // On teste en format mp3 puis wav
            audio.src = `assets/sounds/${name}.mp3`;
            audio.addEventListener('error', () => {
                // Si le mp3 échoue, on tente le wav local
                audio.src = `assets/sounds/${name}.wav`;
            });
            this.sounds[name] = audio;
        });
    }

    initAudioContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    play(name) {
        if (!this.enabled) return;

        // Essayer d'abord de jouer le fichier audio local chargé
        const localSound = this.sounds[name];
        if (localSound && localSound.readyState >= 2) {
            localSound.currentTime = 0;
            localSound.play().catch(() => {
                // Si le navigateur bloque l'autoplay, on passe à la synthèse Web Audio
                this.synthesizeSound(name);
            });
        } else {
            // Pas de fichier audio local -> Synthèse en direct !
            this.synthesizeSound(name);
        }
    }

    synthesizeSound(name) {
        try {
            this.initAudioContext();
            const now = this.ctx.currentTime;
            
            switch (name) {
                case 'move':
                    this.playWoodKnock(120, 0.08, now);
                    break;
                case 'capture':
                    this.playWoodKnock(160, 0.05, now);
                    this.playWoodKnock(140, 0.06, now + 0.06);
                    break;
                case 'check':
                    this.playDualTone(440, 554, 0.25, now);
                    break;
                case 'castle':
                    this.playWoodKnock(130, 0.08, now);
                    this.playWoodKnock(110, 0.08, now + 0.12);
                    break;
                case 'promote':
                    this.playArpeggio([261.6, 329.6, 392, 523.3], 0.3, now);
                    break;
                case 'game_over':
                    this.playArpeggio([392, 349.2, 311.1, 261.6], 0.6, now);
                    break;
            }
        } catch (e) {
            console.warn("Échec de la synthèse audio : ", e);
        }
    }

    playWoodKnock(freq, duration, time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(10, time + duration);
        
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(time);
        osc.stop(time + duration);
    }

    playDualTone(f1, f2, duration, time) {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        osc1.frequency.setValueAtTime(f1, time);
        osc2.frequency.setValueAtTime(f2, time);
        
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.linearRampToValueAtTime(0.2, time + duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + duration);
        osc2.stop(time + duration);
    }

    playArpeggio(notes, totalDuration, time) {
        const step = totalDuration / notes.length;
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time + index * step);
            
            gain.gain.setValueAtTime(0.15, time + index * step);
            gain.gain.exponentialRampToValueAtTime(0.001, time + index * step + step * 0.9);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(time + index * step);
            osc.stop(time + index * step + step * 0.9);
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}
