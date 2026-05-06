// game_face.js - Juego Nativo de Arma la Cara (Arquitectura Sandbox Modular)

(function() {
    // Scope Aislado
    const GameFace = {
        config: null,
        container: null,
        confettiCanvas: null,
        ctx: null,
        animationId: null,
        
        confettiArray: [],
        
        piezasColocadas: {
            'ojos': false,
            'nariz': false,
            'boca': false
        },

        activeDragElement: null,
        offsetX: 0,
        offsetY: 0,
        
        handlers: {},

        init: function(bridge) {
            console.log("[Modulo: Arma la Cara] Inicializando...");
            if (document.getElementById('face-game-container')) return;

            this.config = bridge;
            window.activeKubokiModule = this;
            this.confettiArray = [];
            this.piezasColocadas = { 'ojos': false, 'nariz': false, 'boca': false };
            this.activeDragElement = null;
            
            this.buildDOM();
            this.setupEvents();
            this.loopConfetti();
        },

        buildDOM: function() {
            this.container = document.createElement('div');
            this.container.id = 'face-game-container';
            this.container.className = 'face-sandbox';
            this.container.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: url("kids_magic_background.png") center/cover, radial-gradient(circle at center, #f1c40f 0%, #e67e22 100%);
                z-index: 100000; display: flex; flex-direction: column; overflow: hidden;
                user-select: none; touch-action: none;
            `;

            const topBar = document.createElement('div');
            topBar.className = 'face-topbar';
            topBar.style.cssText = `
                width: 100%; padding: 15px 20px; display: flex; justify-content: space-between;
                align-items: center; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(10px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.1); z-index: 100001;
            `;

            const title = document.createElement('h2');
            title.innerText = '🐼 Arma la Cara';
            title.style.cssText = 'margin: 0; color: #fff; font-size: 2rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);';

            const btnClose = document.createElement('button');
            btnClose.innerText = '❌ Salir';
            btnClose.style.cssText = `
                background: #ff4757; color: white; border: 3px solid white; border-radius: 15px;
                padding: 10px 20px; font-size: 1.2rem; font-weight: bold; cursor: pointer;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            `;
            btnClose.onclick = () => {
                if (this.config && this.config.playSound) this.config.playSound('pop');
                this.destroy();
            };

            topBar.appendChild(title);
            topBar.appendChild(btnClose);
            this.container.appendChild(topBar);

            const mainArea = document.createElement('div');
            mainArea.className = 'face-main-area';
            mainArea.style.cssText = 'flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;';
            this.container.appendChild(mainArea);

            this.confettiCanvas = document.createElement('canvas');
            this.confettiCanvas.className = 'face-confetti-canvas';
            this.confettiCanvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 100002;';
            this.container.appendChild(this.confettiCanvas);

            document.body.appendChild(this.container);

            this.ctx = this.confettiCanvas.getContext('2d');
            this.resizeCanvas();

            this.faceBase = document.createElement('div');
            this.faceBase.className = 'face-base';
            this.faceBase.style.cssText = `
                width: 300px; height: 350px; background: #ffd32a; border-radius: 45% 45% 50% 50%;
                position: relative; box-shadow: 0 15px 30px rgba(0,0,0,0.3), inset -10px -10px 20px rgba(0,0,0,0.1);
                border: 8px solid #ffa801;
            `;
            mainArea.appendChild(this.faceBase);

            this.zones = {
                'ojos': { top: '30%', left: '50%', w: '180px', h: '80px', element: null },
                'nariz': { top: '60%', left: '50%', w: '80px', h: '60px', element: null },
                'boca': { top: '80%', left: '50%', w: '120px', h: '60px', element: null }
            };

            for (let key in this.zones) {
                const z = this.zones[key];
                const div = document.createElement('div');
                div.className = `face-zone face-zone-${key}`;
                div.style.cssText = `
                    position: absolute; top: ${z.top}; left: ${z.left}; width: ${z.w}; height: ${z.h};
                    transform: translate(-50%, -50%); border: 3px dashed rgba(255,255,255,0.5);
                    border-radius: 20px; pointer-events: none;
                `;
                div.dataset.type = key;
                this.faceBase.appendChild(div);
                z.element = div;
            }

            this.piecesPanel = document.createElement('div');
            this.piecesPanel.className = 'face-pieces-panel';
            this.piecesPanel.style.cssText = `
                width: 100%; padding: 20px; background: rgba(255, 255, 255, 0.8); display: flex;
                justify-content: center; gap: 20px; flex-wrap: wrap; box-shadow: 0 -5px 20px rgba(0,0,0,0.1);
                z-index: 100001;
            `;
            this.container.appendChild(this.piecesPanel);

            this.createPieces();
        },

        createPieces: function() {
            const piezasDisponibles = [
                { id: 'ojo1', type: 'ojos', content: '👀', size: '4rem' },
                { id: 'ojo2', type: 'ojos', content: '😎', size: '4rem' },
                { id: 'ojo3', type: 'ojos', content: '🤩', size: '4rem' },
                { id: 'nariz1', type: 'nariz', content: '🐽', size: '3.5rem' },
                { id: 'nariz2', type: 'nariz', content: '🔴', size: '3rem' },
                { id: 'boca1', type: 'boca', content: '👄', size: '4rem' },
                { id: 'boca2', type: 'boca', content: '👅', size: '4rem' },
                { id: 'boca3', type: 'boca', content: '😁', size: '4rem' },
            ];

            piezasDisponibles.forEach(pieza => {
                const div = document.createElement('div');
                div.className = 'face-piece';
                div.innerText = pieza.content;
                div.style.cssText = `
                    font-size: ${pieza.size}; cursor: grab; transition: transform 0.2s;
                    filter: drop-shadow(0 5px 5px rgba(0,0,0,0.3)); z-index: 10;
                `;
                div.dataset.type = pieza.type;
                div.dataset.id = pieza.id;
                
                const slot = document.createElement('div');
                slot.className = 'face-piece-slot';
                slot.style.cssText = `
                    width: 80px; height: 80px; display: flex; justify-content: center; align-items: center;
                    background: rgba(0,0,0,0.05); border-radius: 15px;
                `;
                slot.appendChild(div);
                this.piecesPanel.appendChild(slot);

                const startDrag = (e) => {
                    if (e.type === 'touchstart') e.preventDefault();
                    if (this.config && this.config.playSound) this.config.playSound('pop');
                    
                    this.activeDragElement = div;
                    const rect = div.getBoundingClientRect();
                    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                    
                    this.offsetX = clientX - rect.left;
                    this.offsetY = clientY - rect.top;
                    
                    document.body.appendChild(div);
                    div.style.position = 'fixed';
                    div.style.left = (clientX - this.offsetX) + 'px';
                    div.style.top = (clientY - this.offsetY) + 'px';
                    div.style.transform = 'scale(1.2)';
                    div.style.cursor = 'grabbing';
                    div.style.zIndex = '100005';
                };

                // Guardar handler para poder limpiar (aunque la pieza se borra del DOM, es buena practica)
                div._startDragHandler = startDrag;
                div.addEventListener('mousedown', startDrag);
                div.addEventListener('touchstart', startDrag, { passive: false });
            });
        },

        resizeCanvas: function() {
            if (!this.confettiCanvas) return;
            this.confettiCanvas.width = this.container.clientWidth;
            this.confettiCanvas.height = this.container.clientHeight;
        },

        createConfettiParticle: function(x, y) {
            const colors = ['#ff4757', '#1e90ff', '#2ed573', '#ffa502', '#9c88ff', '#f1c40f'];
            return {
                x: x, y: y,
                size: Math.random() * 10 + 5,
                speedX: (Math.random() - 0.5) * 15,
                speedY: (Math.random() - 1) * 15,
                gravity: 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                spin: (Math.random() - 0.5) * 10
            };
        },

        fireConfetti: function(x, y) {
            for(let i=0; i<30; i++) {
                this.confettiArray.push(this.createConfettiParticle(x, y));
            }
        },

        loopConfetti: function() {
            if (!this.ctx) return;
            this.ctx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
            for(let i = this.confettiArray.length - 1; i >= 0; i--) {
                const p = this.confettiArray[i];
                p.x += p.speedX; p.y += p.speedY; p.speedY += p.gravity; p.rotation += p.spin;
                
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation * Math.PI / 180);
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                this.ctx.restore();
                
                if (p.y > this.confettiCanvas.height + 50) {
                    this.confettiArray.splice(i, 1);
                }
            }
            this.animationId = requestAnimationFrame(this.loopConfetti.bind(this));
        },

        setupEvents: function() {
            this.handlers.resize = this.resizeCanvas.bind(this);
            window.addEventListener('resize', this.handlers.resize);

            this.handlers.onMove = (e) => {
                if (!this.activeDragElement) return;
                if (e.type === 'touchmove') e.preventDefault();
                
                const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                
                this.activeDragElement.style.left = (clientX - this.offsetX) + 'px';
                this.activeDragElement.style.top = (clientY - this.offsetY) + 'px';
            };

            this.handlers.onEnd = (e) => {
                if (!this.activeDragElement) return;
                
                this.activeDragElement.style.transform = 'scale(1)';
                this.activeDragElement.style.cursor = 'grab';
                
                const clientX = e.type.includes('touch') ? e.changedTouches[0].clientX : e.clientX;
                const clientY = e.type.includes('touch') ? e.changedTouches[0].clientY : e.clientY;

                const type = this.activeDragElement.dataset.type;
                const zone = this.zones[type];
                const zoneRect = zone.element.getBoundingClientRect();

                if (clientX > zoneRect.left && clientX < zoneRect.right &&
                    clientY > zoneRect.top && clientY < zoneRect.bottom) {
                    
                    this.faceBase.appendChild(this.activeDragElement);
                    this.activeDragElement.style.position = 'absolute';
                    this.activeDragElement.style.top = zone.top;
                    this.activeDragElement.style.left = zone.left;
                    this.activeDragElement.style.transform = 'translate(-50%, -50%)';
                    
                    Array.from(this.faceBase.children).forEach(child => {
                        if (child !== this.activeDragElement && child !== zone.element && child.dataset.type === type) {
                            child.style.display = 'none'; 
                        }
                    });

                    if (this.config && this.config.playSound) this.config.playSound('brillo');
                    this.fireConfetti(clientX, clientY);

                    this.piezasColocadas[type] = true;

                    if (this.piezasColocadas.ojos && this.piezasColocadas.nariz && this.piezasColocadas.boca) {
                        setTimeout(() => {
                            this.fireConfetti(this.container.clientWidth/2, this.container.clientHeight/2);
                            this.fireConfetti(this.container.clientWidth/3, this.container.clientHeight/3);
                            this.fireConfetti(this.container.clientWidth*0.6, this.container.clientHeight*0.6);
                            if (this.config && this.config.onReward) this.config.onReward('silver');
                            
                            this.piezasColocadas = { 'ojos': false, 'nariz': false, 'boca': false };
                        }, 500);
                    }
                } else {
                    const originalSlot = Array.from(this.piecesPanel.children).find(slot => 
                        !slot.hasChildNodes() || slot.children[0].style.display === 'none'
                    );
                    
                    if (originalSlot) {
                        originalSlot.appendChild(this.activeDragElement);
                        this.activeDragElement.style.position = 'relative';
                        this.activeDragElement.style.top = '0';
                        this.activeDragElement.style.left = '0';
                        this.activeDragElement.style.transform = 'none';
                    } else {
                        this.piecesPanel.appendChild(this.activeDragElement);
                        this.activeDragElement.style.position = 'relative';
                        this.activeDragElement.style.top = '0';
                        this.activeDragElement.style.left = '0';
                        this.activeDragElement.style.transform = 'none';
                    }
                }

                this.activeDragElement = null;
            };

            this.container.addEventListener('mousemove', this.handlers.onMove);
            this.container.addEventListener('touchmove', this.handlers.onMove, { passive: false });
            this.container.addEventListener('mouseup', this.handlers.onEnd);
            this.container.addEventListener('touchend', this.handlers.onEnd);
        },

        destroy: function() {
            console.log("[Modulo: Arma la Cara] Destruyendo...");
            
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }

            window.removeEventListener('resize', this.handlers.resize);
            if (this.container) {
                this.container.removeEventListener('mousemove', this.handlers.onMove);
                this.container.removeEventListener('touchmove', this.handlers.onMove);
                this.container.removeEventListener('mouseup', this.handlers.onEnd);
                this.container.removeEventListener('touchend', this.handlers.onEnd);
            }

            if (this.config && this.config.onExit) {
                this.config.onExit({ game: 'face' });
            }

            // Si hay un elemento agarrado en el body, eliminarlo para no dejar basura global
            if (this.activeDragElement && this.activeDragElement.parentNode === document.body) {
                document.body.removeChild(this.activeDragElement);
            }

            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }

            this.container = null;
            this.confettiCanvas = null;
            this.ctx = null;
            this.faceBase = null;
            this.piecesPanel = null;
            this.confettiArray = [];
            this.config = null;
        }
    };

    window.initGameFace = function() {
        GameFace.init({
            lang: (typeof userData !== 'undefined' && userData.idioma) ? userData.idioma : 'es-ES',
            playSound: (type) => {
                if (typeof window.sonarEfecto === 'function') window.sonarEfecto(type);
            },
            onReward: (type) => {
                if (typeof window.rewardEgg === 'function') window.rewardEgg(type);
            },
            onExit: (data) => {
                if (typeof window.askGroq === 'function') {
                    window.askGroq(`[System: El niño terminó de jugar a "Arma la Cara". Felicítalo por crear caras tan divertidas y pregúntale si quiere jugar otra cosa. IDIOMA: ${typeof userData !== 'undefined' ? userData.idioma : 'es-ES'}]`, true);
                }
            }
        });
    };
})();
