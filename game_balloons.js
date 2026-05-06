// game_balloons.js - Juego Nativo de Globos Locos (Arquitectura Sandbox Modular)

(function() {
    // Scope Aislado: Todo el estado del juego se mantiene dentro de este objeto
    const GameBalloons = {
        config: null,
        container: null,
        canvas: null,
        ctx: null,
        animationId: null,
        balloons: [],
        particles: [],
        score: 0,
        globosExplotados: 0,
        
        // Colores vibrantes encapsulados
        colors: [
            { c: '#ff4757', highlight: '#ff6b81' }, // Rojo
            { c: '#1e90ff', highlight: '#70a1ff' }, // Azul
            { c: '#2ed573', highlight: '#7bed9f' }, // Verde
            { c: '#ffa502', highlight: '#ff7f50' }, // Naranja
            { c: '#9c88ff', highlight: '#a29bfe' }  // Morado
        ],

        // Handlers cacheados para poder removerlos luego
        handlers: {},

        /**
         * Inicializa el juego.
         * Bridge de Entrada: Recibe configuraciones y callbacks del sistema principal.
         * @param {Object} bridge - { lang, onReward, onExit, playSound }
         */
        init: function(bridge) {
            console.log("[Modulo: Globos Locos] Inicializando...");
            if (document.getElementById('balloons-game-container')) return;

            this.config = bridge;
            window.activeKubokiModule = this;
            this.balloons = [];
            this.particles = [];
            this.score = 0;
            this.globosExplotados = 0;

            this.buildDOM();
            this.setupEvents();
            this.loop();
        },

        buildDOM: function() {
            // Contenedor principal con clase aislada
            this.container = document.createElement('div');
            this.container.id = 'balloons-game-container';
            this.container.className = 'balloons-sandbox';
            this.container.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: linear-gradient(135deg, #87CEEB 0%, #E0F6FF 100%);
                z-index: 100000; display: flex; flex-direction: column; overflow: hidden;
            `;

            // Barra superior
            const topBar = document.createElement('div');
            topBar.className = 'balloons-topbar';
            topBar.style.cssText = `
                width: 100%; padding: 15px 20px; display: flex; justify-content: space-between;
                align-items: center; background: rgba(255, 255, 255, 0.3); backdrop-filter: blur(10px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.1); z-index: 100001;
            `;

            const title = document.createElement('h2');
            title.innerText = '🎈 Globos Locos';
            title.style.cssText = 'margin: 0; color: #333; font-size: 2rem; text-shadow: 2px 2px 4px rgba(255,255,255,0.8);';

            const btnClose = document.createElement('button');
            btnClose.innerText = '❌ Salir';
            btnClose.style.cssText = `
                background: #ff4757; color: white; border: 3px solid white; border-radius: 15px;
                padding: 10px 20px; font-size: 1.2rem; font-weight: bold; cursor: pointer;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            `;
            
            // Bridge de Salida: Finalizar juego
            btnClose.onclick = () => {
                if (this.config && this.config.playSound) this.config.playSound('pop');
                this.destroy();
            };

            topBar.appendChild(title);
            topBar.appendChild(btnClose);
            this.container.appendChild(topBar);

            // Canvas
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'balloons-canvas';
            this.canvas.style.cssText = 'flex: 1; width: 100%; height: 100%; display: block;';
            this.container.appendChild(this.canvas);

            document.body.appendChild(this.container);

            this.ctx = this.canvas.getContext('2d');
            this.resize();
        },

        resize: function() {
            if (!this.canvas) return;
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
        },

        setupEvents: function() {
            this.handlers.resize = this.resize.bind(this);
            window.addEventListener('resize', this.handlers.resize);

            this.handlers.mousedown = (e) => this.checkClick(e.clientX, e.clientY);
            this.handlers.touchstart = (e) => {
                e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    this.checkClick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                }
            };

            this.canvas.addEventListener('mousedown', this.handlers.mousedown);
            this.canvas.addEventListener('touchstart', this.handlers.touchstart, { passive: false });
        },

        createBalloon: function() {
            const radius = Math.random() * 20 + 40;
            return {
                radius: radius,
                x: Math.random() * (this.canvas.width - radius * 2) + radius,
                y: this.canvas.height + radius * 2,
                speedY: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 1,
                colorInfo: this.colors[Math.floor(Math.random() * this.colors.length)],
                phase: Math.random() * Math.PI * 2
            };
        },

        createExplosion: function(x, y, color) {
            for (let i = 0; i < 20; i++) {
                this.particles.push({
                    x: x, y: y,
                    size: Math.random() * 5 + 2,
                    speedX: (Math.random() - 0.5) * 10,
                    speedY: (Math.random() - 0.5) * 10,
                    color: color,
                    life: 1.0
                });
            }
        },

        loop: function() {
            if (!this.ctx) return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (Math.random() < 0.03) {
                this.balloons.push(this.createBalloon());
            }

            // Globos
            for (let i = this.balloons.length - 1; i >= 0; i--) {
                const b = this.balloons[i];
                b.y -= b.speedY;
                b.x += b.speedX + Math.sin(b.phase) * 0.5;
                b.phase += 0.05;

                this.ctx.save();
                this.ctx.translate(b.x, b.y);
                this.ctx.rotate(Math.sin(b.phase) * 5 * Math.PI / 180);
                
                this.ctx.beginPath();
                this.ctx.moveTo(0, b.radius);
                this.ctx.quadraticCurveTo(-10, b.radius + 20, 0, b.radius + 40);
                this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.scale(1, 1.2);
                this.ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
                const gradient = this.ctx.createRadialGradient(-b.radius/3, -b.radius/3, b.radius/10, 0, 0, b.radius);
                gradient.addColorStop(0, b.colorInfo.highlight);
                gradient.addColorStop(1, b.colorInfo.c);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
                this.ctx.restore();

                if (b.y + b.radius * 2 < 0) this.balloons.splice(i, 1);
            }

            // Particulas
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.speedX;
                p.y += p.speedY;
                p.life -= 0.02;

                this.ctx.save();
                this.ctx.globalAlpha = p.life;
                this.ctx.fillStyle = p.color;
                this.ctx.translate(p.x, p.y);
                this.ctx.beginPath();
                for (let j = 0; j < 5; j++) {
                    this.ctx.lineTo(Math.cos((18 + j * 72) * Math.PI / 180) * p.size, -Math.sin((18 + j * 72) * Math.PI / 180) * p.size);
                    this.ctx.lineTo(Math.cos((54 + j * 72) * Math.PI / 180) * (p.size/2), -Math.sin((54 + j * 72) * Math.PI / 180) * (p.size/2));
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.restore();

                if (p.life <= 0) this.particles.splice(i, 1);
            }

            this.animationId = requestAnimationFrame(this.loop.bind(this));
        },

        checkClick: function(clientX, clientY) {
            const rect = this.canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            for (let i = this.balloons.length - 1; i >= 0; i--) {
                const b = this.balloons[i];
                const dist = Math.hypot(b.x - x, b.y - y);
                
                if (dist < b.radius * 1.2) {
                    this.createExplosion(b.x, b.y, b.colorInfo.c);
                    this.balloons.splice(i, 1);
                    
                    // Bridge Salida: Efecto de sonido
                    if (this.config && this.config.playSound) this.config.playSound('pop');
                    
                    this.score++;
                    this.globosExplotados++;
                    
                    // Bridge Salida: Recompensa
                    if (this.globosExplotados >= 15) {
                        this.globosExplotados = 0;
                        if (this.config && this.config.onReward) this.config.onReward('silver');
                    }
                    break;
                }
            }
        },

        /**
         * Destruye el juego y limpia la memoria.
         */
        destroy: function() {
            console.log("[Modulo: Globos Locos] Limpiando y destruyendo...");
            
            // 1. Detener ciclo de animacion
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }

            // 2. Limpiar listeners del DOM
            window.removeEventListener('resize', this.handlers.resize);
            if (this.canvas) {
                this.canvas.removeEventListener('mousedown', this.handlers.mousedown);
                this.canvas.removeEventListener('touchstart', this.handlers.touchstart);
            }

            // 3. Notificar al Engine Principal (App.js)
            if (this.config && this.config.onExit) {
                this.config.onExit({ game: 'balloons', score: this.score });
            }

            // 4. Destruir nodos DOM
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }

            // 5. Liberar memoria
            this.container = null;
            this.canvas = null;
            this.ctx = null;
            this.balloons = [];
            this.particles = [];
            this.config = null;
        }
    };

    // Exponer SOLAMENTE el inicializador al Engine Principal (App.js)
    window.initGameBalloons = function() {
        // El puente con el motor principal
        GameBalloons.init({
            lang: (typeof userData !== 'undefined' && userData.idioma) ? userData.idioma : 'es-ES',
            playSound: (type) => {
                if (typeof window.sonarEfecto === 'function') window.sonarEfecto(type);
            },
            onReward: (type) => {
                if (typeof window.rewardEgg === 'function') window.rewardEgg(type);
            },
            onExit: (data) => {
                if (typeof window.askGroq === 'function') {
                    window.askGroq(`[System: El niño terminó de jugar a los Globos Locos. Explotó ${data.score} globos. Felicítalo alegremente de forma muy breve. IDIOMA: ${typeof userData !== 'undefined' ? userData.idioma : 'es-ES'}]`, true);
                }
            }
        });
    };

})();
