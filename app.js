import { GameController } from './src/gameController.js';

window.addEventListener('DOMContentLoaded', () => {
    try {
        window.game = new GameController();
    } catch (error) {
        console.error("Erreur lors de l'initialisation :", error);
        const errDiv = document.createElement('div');
        errDiv.style.position = 'fixed';
        errDiv.style.top = '10px';
        errDiv.style.left = '10px';
        errDiv.style.right = '10px';
        errDiv.style.background = '#ef4444';
        errDiv.style.color = '#fff';
        errDiv.style.padding = '15px';
        errDiv.style.zIndex = '99999';
        errDiv.style.borderRadius = '8px';
        errDiv.style.fontFamily = 'monospace';
        errDiv.style.fontSize = '14px';
        errDiv.style.whiteSpace = 'pre-wrap';
        errDiv.innerHTML = `<strong>Erreur de chargement de l'application :</strong><br>${error.stack || error.message || error}`;
        document.body.appendChild(errDiv);
    }
});

