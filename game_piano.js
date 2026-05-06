// game_piano.js - Juego Nativo de Piano Mágico (Arquitectura Sandbox Modular)

(function() {
    // Scope Aislado
    const GamePiano = {
        config: null,
        container: null,
        audioCtx: null,
        visualizerArea: null,
        keysContainer: null,
        totalNotasTocadas: 0,
        
        notes: [
            { note: 'Do', freq: 261.63, color: '#ff4757' },
            { note: 'Re', freq: 293.66, color: '#ffa502' },
            { note: 'Mi', freq: 329.63, color: '#eccc68' },
            { note: 'Fa', freq: 349.23, color: '#2ed573' },
            { note: 'Sol', freq: 392.00, color: '#1e90ff' },
            { note: 'La', freq: 440.00, color: '#9c88ff' },
            { note: 'Si', freq: 493.88, color: '#ff6b81' },
            { note: 'Do', freq: 523.25, color: '#00ffff' }
        ],

        // Almacenar referencias a handlers de eventos de las teclas para limpiarlos
        keyElements: [],

        init: function(bridge) {
            console.log("[Modulo: Piano Mágico] Inicializando...");
            if (document.getElementById('piano-game-container')) return;

            this.config = bridge;
            window.activeKubokiModule = this;
            this.totalNotasTocadas = 0;
            this.keyElements = [];
            
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();

            this.buildDOM();
        },

        buildDOM: function() {
            this.container = document.createElement('div');
            this.container.id = 'piano-game-container';
            this.container.className = 'piano-sandbox';
            this.container.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: radial-gradient(circle at center, #2c3e50 0%, #000000 100%);
                z-index: 100000; display: flex; flex-direction: column; overflow: hidden;
            `;

            const stars = document.createElement('div');
            stars.className = 'piano-stars-bg';
            stars.style.cssText = `
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;
                background-color: transparent;
                background-image: radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 4px),
                                  radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 2px),
                                  radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 3px);
                background-size: 550px 550px, 350px 350px, 250px 250px;
                background-position: 0 0, 40px 60px, 130px 270px;
            `;
            this.container.appendChild(stars);

            const topBar = document.createElement('div');
            topBar.className = 'piano-topbar';
            topBar.style.cssText = `
                width: 100%; padding: 15px 20px; display: flex; justify-content: space-between;
                align-items: center; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);
                z-index: 100001;
            `;

            const title = document.createElement('h2');
            title.innerText = '🎹 Piano Mágico';
            title.style.cssText = 'margin: 0; color: #fff; font-size: 2rem; text-shadow: 0 0 10px #00ffff;';

            const btnClose = document.createElement('button');
            btnClose.innerText = '❌ Salir';
            btnClose.style.cssText = `
                background: #ff4757; color: white; border: 2px solid white; border-radius: 15px;
                padding: 10px 20px; font-size: 1.2rem; font-weight: bold; cursor: pointer;
                box-shadow: 0 5px 15px rgba(255,71,87,0.5);
            `;
            btnClose.onclick = () => {
                if (this.config && this.config.playSound) this.config.playSound('pop');
                this.destroy();
            };

            topBar.appendChild(title);
            topBar.appendChild(btnClose);
            this.container.appendChild(topBar);

            this.visualizerArea = document.createElement('div');
            this.visualizerArea.className = 'piano-visualizer';
            this.visualizerArea.style.cssText = 'flex: 1; position: relative;';
            this.container.appendChild(this.visualizerArea);

            this.keysContainer = document.createElement('div');
            this.keysContainer.className = 'piano-keys-container';
            this.keysContainer.style.cssText = 'height: 40vh; display: flex; padding: 20px; gap: 10px; z-index: 100001;';
            this.container.appendChild(this.keysContainer);

            document.body.appendChild(this.container);

            this.createKeys();
        },

        playNote: function(freq, type = 'sine') {
            if (!this.audioCtx) return;
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
            
            const osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            
            gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, this.audioCtx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.5);
            
            osc.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            
            osc.start();
            osc.stop(this.audioCtx.currentTime + 1.5);
        },

        spawnFloatingNote: function(color, keyElement) {
            const symbols = ['🎵', '🎶', '🎼', '✨'];
            const noteEl = document.createElement('div');
            noteEl.innerText = symbols[Math.floor(Math.random() * symbols.length)];
            
            const rect = keyElement.getBoundingClientRect();
            noteEl.style.cssText = `
                position: absolute; left: ${rect.left + rect.width / 2 - 20}px; bottom: 40vh;
                font-size: ${30 + Math.random() * 30}px; color: ${color}; text-shadow: 0 0 10px ${color};
                pointer-events: none; transition: all 2s ease-out; opacity: 1;
                transform: translateY(0) rotate(${(Math.random()-0.5)*45}deg); z-index: 100000;
            `;
            
            this.visualizerArea.appendChild(noteEl);

            requestAnimationFrame(() => {
                noteEl.style.transform = `translateY(-${300 + Math.random()*200}px) translateX(${(Math.random()-0.5)*100}px) rotate(${(Math.random()-0.5)*180}deg) scale(1.5)`;
                noteEl.style.opacity = '0';
            });

            setTimeout(() => {
                if (noteEl.parentNode) noteEl.parentNode.removeChild(noteEl);
            }, 2000);
        },

        createKeys: function() {
            this.notes.forEach((noteObj) => {
                const keyEl = document.createElement('div');
                keyEl.className = 'piano-key';
                keyEl.style.cssText = `
                    flex: 1; background: linear-gradient(to bottom, #ffffff 0%, #e0e0e0 100%);
                    border: 2px solid #ccc; border-radius: 0 0 20px 20px;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.5), inset 0 -5px 15px rgba(0,0,0,0.2);
                    display: flex; align-items: flex-end; justify-content: center;
                    padding-bottom: 20px; font-size: 1.5rem; font-weight: bold; color: #333;
                    cursor: pointer; transition: transform 0.1s, box-shadow 0.1s, background 0.1s;
                    user-select: none; border-bottom: 10px solid ${noteObj.color};
                `;
                keyEl.innerText = noteObj.note;

                const pressKey = (e) => {
                    if (e) e.preventDefault();
                    keyEl.style.transform = 'translateY(10px)';
                    keyEl.style.boxShadow = `0 2px 5px rgba(0,0,0,0.5), inset 0 -5px 15px rgba(0,0,0,0.2), 0 0 30px ${noteObj.color}`;
                    keyEl.style.background = `linear-gradient(to bottom, #ffffff 0%, ${noteObj.color}33 100%)`;
                    
                    this.playNote(noteObj.freq, 'sine');
                    this.playNote(noteObj.freq, 'triangle');
                    
                    this.spawnFloatingNote(noteObj.color, keyEl);

                    this.totalNotasTocadas++;
                    if (this.totalNotasTocadas % 30 === 0) {
                        if (this.config && this.config.onReward) this.config.onReward('silver');
                    }
                };

                const releaseKey = (e) => {
                    if (e) e.preventDefault();
                    keyEl.style.transform = 'translateY(0)';
                    keyEl.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5), inset 0 -5px 15px rgba(0,0,0,0.2)';
                    keyEl.style.background = 'linear-gradient(to bottom, #ffffff 0%, #e0e0e0 100%)';
                };

                keyEl.addEventListener('mousedown', pressKey);
                keyEl.addEventListener('mouseup', releaseKey);
                keyEl.addEventListener('mouseleave', releaseKey);
                keyEl.addEventListener('touchstart', pressKey, { passive: false });
                keyEl.addEventListener('touchend', releaseKey, { passive: false });

                // Almacenar para limpiar en destroy
                this.keyElements.push({
                    el: keyEl,
                    press: pressKey,
                    release: releaseKey
                });

                this.keysContainer.appendChild(keyEl);
            });
        },

        destroy: function() {
            console.log("[Modulo: Piano Mágico] Destruyendo...");
            
            // Remover eventos de las teclas
            this.keyElements.forEach(item => {
                item.el.removeEventListener('mousedown', item.press);
                item.el.removeEventListener('mouseup', item.release);
                item.el.removeEventListener('mouseleave', item.release);
                item.el.removeEventListener('touchstart', item.press);
                item.el.removeEventListener('touchend', item.release);
            });

            if (this.audioCtx && this.audioCtx.state !== 'closed') {
                this.audioCtx.close();
            }

            if (this.config && this.config.onExit) {
                this.config.onExit({ game: 'piano', score: this.totalNotasTocadas });
            }

            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }

            this.container = null;
            this.visualizerArea = null;
            this.keysContainer = null;
            this.audioCtx = null;
            this.keyElements = [];
            this.config = null;
        }
    };

    window.initGamePiano = function() {
        GamePiano.init({
            lang: (typeof userData !== 'undefined' && userData.idioma) ? userData.idioma : 'es-ES',
            playSound: (type) => {
                if (typeof window.sonarEfecto === 'function') window.sonarEfecto(type);
            },
            onReward: (type) => {
                if (typeof window.rewardEgg === 'function') window.rewardEgg(type);
            },
            onExit: (data) => {
                if (typeof window.askGroq === 'function') {
                    window.askGroq(`[System: El niño terminó de tocar el Piano Mágico. Tocó un total de ${data.score} notas. Felicítalo por su talento musical de forma entusiasta y corta. IDIOMA: ${typeof userData !== 'undefined' ? userData.idioma : 'es-ES'}]`, true);
                }
            }
        });
    };
})();
