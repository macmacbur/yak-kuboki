// game_moles.js - Juego Nativo de Atrapa al Topo (Arquitectura Sandbox Modular)

(function() {
    // Scope Aislado
    const GameMoles = {
        config: null,
        container: null,
        canvas: null,
        scoreUI: null,
        ctx: null,
        animationId: null,
        
        width: 0,
        height: 0,
        score: 0,
        toposAtrapadosTotal: 0,
        
        cols: 3,
        rows: 3,
        holes: [],
        particles: [],
        popups: [],

        mouseX: -100,
        mouseY: -100,
        isClicking: false,

        handlers: {},

        init: function(bridge) {
            console.log("[Modulo: Atrapa al Topo] Inicializando...");
            if (document.getElementById('moles-game-container')) return;

            this.config = bridge;
            window.activeKubokiModule = this;
            this.holes = [];
            this.particles = [];
            this.popups = [];
            this.score = 0;
            this.toposAtrapadosTotal = 0;
            this.mouseX = -100;
            this.mouseY = -100;
            this.isClicking = false;

            this.buildDOM();
            this.setupEvents();
            this.loop();
        },

        buildDOM: function() {
            this.container = document.createElement('div');
            this.container.id = 'moles-game-container';
            this.container.className = 'moles-sandbox';
            this.container.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 40%, #7bed9f 40%, #2ed573 100%);
                z-index: 100000; display: flex; flex-direction: column; overflow: hidden;
                cursor: crosshair;
            `;

            const topBar = document.createElement('div');
            topBar.className = 'moles-topbar';
            topBar.style.cssText = `
                width: 100%; padding: 15px 20px; display: flex; justify-content: space-between;
                align-items: center; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(10px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.1); z-index: 100001;
            `;

            const title = document.createElement('h2');
            title.innerText = '🔨 Atrapa al Topo';
            title.style.cssText = 'margin: 0; color: #333; font-size: 2rem; text-shadow: 2px 2px 4px rgba(255,255,255,0.8);';

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

            this.scoreUI = document.createElement('div');
            this.scoreUI.style.cssText = `
                position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
                background: #ffa502; color: white; padding: 10px 30px; border-radius: 30px;
                font-size: 2rem; font-weight: bold; border: 4px solid white;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3); z-index: 100001; transition: transform 0.1s;
            `;
            this.scoreUI.innerText = '0';
            this.container.appendChild(this.scoreUI);

            this.canvas = document.createElement('canvas');
            this.canvas.className = 'moles-canvas';
            this.canvas.style.cssText = 'flex: 1; width: 100%; height: 100%; display: block;';
            this.container.appendChild(this.canvas);

            document.body.appendChild(this.container);

            this.ctx = this.canvas.getContext('2d');
            this.resize();
        },

        resize: function() {
            if (!this.canvas) return;
            this.width = this.canvas.clientWidth;
            this.height = this.canvas.clientHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            
            this.holes = [];
            const marginX = this.width * 0.1;
            const marginY = this.height * 0.5; 
            const gridW = this.width - marginX * 2;
            const gridH = this.height - marginY - (this.height * 0.1);
            
            const cellW = gridW / this.cols;
            const cellH = gridH / this.rows;

            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    this.holes.push({
                        x: marginX + cellW * c + cellW/2,
                        y: marginY + cellH * r + cellH/2,
                        radius: Math.min(cellW, cellH) * 0.4,
                        moleState: 'hidden',
                        moleY: 0,
                        timer: 0,
                        maxOffset: Math.min(cellW, cellH) * 0.4 * 1.5,
                        type: Math.random() > 0.8 ? 'gold' : 'normal'
                    });
                }
            }
        },

        createParticle: function(x, y, color, type='dirt') {
            return {
                x: x, y: y,
                size: Math.random() * (type === 'dirt' ? 8 : 15) + 4,
                speedX: (Math.random() - 0.5) * 15,
                speedY: (Math.random() - 1) * 15,
                gravity: 0.5,
                color: color,
                life: 1.0,
                type: type,
                angle: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.2
            };
        },

        createPopup: function(x, y, text) {
            return { x: x, y: y, text: text, life: 1.0 };
        },

        updateHole: function(h) {
            switch(h.moleState) {
                case 'hidden':
                    if (Math.random() < 0.005) {
                        h.moleState = 'rising';
                        h.type = Math.random() > 0.8 ? 'gold' : 'normal';
                        for(let i=0; i<5; i++) this.particles.push(this.createParticle(h.x, h.y, '#5c3a21', 'dirt'));
                    }
                    break;
                case 'rising':
                    h.moleY += 5;
                    if (h.moleY >= h.maxOffset) {
                        h.moleY = h.maxOffset;
                        h.moleState = 'visible';
                        h.timer = 60 + Math.random() * 60; 
                    }
                    break;
                case 'visible':
                    h.timer--;
                    if (h.timer <= 0) h.moleState = 'falling';
                    break;
                case 'falling':
                    h.moleY -= 5;
                    if (h.moleY <= 0) {
                        h.moleY = 0;
                        h.moleState = 'hidden';
                    }
                    break;
                case 'hit':
                    h.timer--;
                    if (h.timer <= 0) {
                        h.moleY -= 10;
                        if (h.moleY <= 0) {
                            h.moleY = 0;
                            h.moleState = 'hidden';
                        }
                    }
                    break;
            }
        },

        drawHole: function(h) {
            const ctx = this.ctx;
            // Sombra del agujero
            ctx.save();
            ctx.translate(h.x, h.y);
            ctx.beginPath();
            ctx.scale(1, 0.4);
            ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#2d1b10';
            ctx.fill();
            ctx.restore();

            // Dibujar Topo si est fuera
            if (h.moleY > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(h.x - h.radius, h.y - h.maxOffset * 2, h.radius * 2, h.maxOffset * 2 + 10);
                ctx.clip();
                
                ctx.translate(h.x, h.y - h.moleY + 10);
                
                ctx.beginPath();
                ctx.arc(0, 0, h.radius * 0.7, Math.PI, 0);
                ctx.lineTo(h.radius * 0.7, h.maxOffset);
                ctx.lineTo(-h.radius * 0.7, h.maxOffset);
                ctx.fillStyle = h.type === 'gold' ? '#f1c40f' : '#8B4513';
                ctx.fill();
                
                if (h.moleState === 'hit') {
                    ctx.fillStyle = 'black';
                    ctx.font = `${h.radius*0.4}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('x   x', 0, -h.radius*0.2);
                    ctx.beginPath();
                    ctx.arc(0, h.radius*0.2, h.radius*0.2, 0, Math.PI);
                    ctx.stroke();
                } else {
                    ctx.fillStyle = 'black';
                    ctx.beginPath();
                    ctx.arc(-h.radius*0.25, -h.radius*0.2, h.radius*0.1, 0, Math.PI*2);
                    ctx.arc(h.radius*0.25, -h.radius*0.2, h.radius*0.1, 0, Math.PI*2);
                    ctx.fill();
                    ctx.fillStyle = '#ff9ff3';
                    ctx.beginPath();
                    ctx.arc(0, 0, h.radius*0.15, 0, Math.PI*2);
                    ctx.fill();
                }
                ctx.restore();
            }

            // Borde delantero
            ctx.save();
            ctx.translate(h.x, h.y);
            ctx.beginPath();
            ctx.scale(1, 0.4);
            ctx.arc(0, 0, h.radius, 0, Math.PI);
            ctx.lineWidth = h.radius * 0.2;
            ctx.strokeStyle = '#5c3a21';
            ctx.stroke();
            ctx.restore();
        },

        checkHit: function(h, x, y) {
            if (h.moleState === 'rising' || h.moleState === 'visible') {
                const headY = h.y - h.moleY;
                const dist = Math.hypot(h.x - x, headY - y);
                if (dist < h.radius) {
                    h.moleState = 'hit';
                    h.timer = 15; 
                    
                    const points = h.type === 'gold' ? 3 : 1;
                    this.score += points;
                    this.scoreUI.innerText = this.score;
                    this.scoreUI.style.transform = 'translateX(-50%) scale(1.3)';
                    setTimeout(() => { if (this.scoreUI) this.scoreUI.style.transform = 'translateX(-50%) scale(1)'; }, 100);

                    const color = h.type === 'gold' ? '#f1c40f' : '#ff9ff3';
                    for(let i=0; i<15; i++) this.particles.push(this.createParticle(h.x, headY, color, 'star'));
                    this.popups.push(this.createPopup(h.x, headY - 30, `+${points}`));

                    if (this.config && this.config.playSound) this.config.playSound('pop');
                    
                    this.toposAtrapadosTotal += points;
                    if (this.toposAtrapadosTotal >= 15) {
                        this.toposAtrapadosTotal = 0;
                        if (this.config && this.config.onReward) this.config.onReward('silver');
                    }
                    return true;
                }
            }
            return false;
        },

        setupEvents: function() {
            this.handlers.resize = this.resize.bind(this);
            window.addEventListener('resize', this.handlers.resize);

            this.handlers.mousemove = (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                this.mouseY = e.clientY - rect.top;
            };
            this.handlers.mouseleave = () => { this.mouseX = -100; this.mouseY = -100; };
            
            const onInteract = (x, y) => {
                this.isClicking = true;
                setTimeout(() => this.isClicking = false, 100);
                for(let i=0; i<5; i++) this.particles.push(this.createParticle(x, y, '#ffffff', 'star'));
                if (this.config && this.config.playSound) this.config.playSound('pop');
                this.holes.forEach(h => this.checkHit(h, x, y));
            };

            this.handlers.mousedown = (e) => {
                const rect = this.canvas.getBoundingClientRect();
                onInteract(e.clientX - rect.left, e.clientY - rect.top);
            };

            this.handlers.touchstart = (e) => {
                e.preventDefault();
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.touches[0].clientX - rect.left;
                this.mouseY = e.touches[0].clientY - rect.top;
                onInteract(this.mouseX, this.mouseY);
            };

            this.handlers.touchmove = (e) => {
                e.preventDefault();
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.touches[0].clientX - rect.left;
                this.mouseY = e.touches[0].clientY - rect.top;
            };

            this.canvas.addEventListener('mousemove', this.handlers.mousemove);
            this.canvas.addEventListener('mouseleave', this.handlers.mouseleave);
            this.canvas.addEventListener('mousedown', this.handlers.mousedown);
            this.canvas.addEventListener('touchstart', this.handlers.touchstart, { passive: false });
            this.canvas.addEventListener('touchmove', this.handlers.touchmove, { passive: false });
        },

        loop: function() {
            if (!this.ctx) return;
            this.ctx.clearRect(0, 0, this.width, this.height);

            this.holes.forEach(h => {
                this.updateHole(h);
                this.drawHole(h);
            });

            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.speedX; p.y += p.speedY; p.speedY += p.gravity;
                p.life -= 0.02; p.angle += p.spin;
                
                this.ctx.save();
                this.ctx.globalAlpha = p.life;
                this.ctx.fillStyle = p.color;
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.angle);
                if (p.type === 'dirt') {
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    this.ctx.fill();
                } else {
                    this.ctx.beginPath();
                    for (let j = 0; j < 5; j++) {
                        this.ctx.lineTo(Math.cos((18 + j * 72) * Math.PI / 180) * p.size, -Math.sin((18 + j * 72) * Math.PI / 180) * p.size);
                        this.ctx.lineTo(Math.cos((54 + j * 72) * Math.PI / 180) * (p.size/2), -Math.sin((54 + j * 72) * Math.PI / 180) * (p.size/2));
                    }
                    this.ctx.closePath();
                    this.ctx.fill();
                }
                this.ctx.restore();

                if (p.life <= 0) this.particles.splice(i, 1);
            }

            for (let i = this.popups.length - 1; i >= 0; i--) {
                const pop = this.popups[i];
                pop.y -= 2; pop.life -= 0.02;
                this.ctx.save();
                this.ctx.globalAlpha = pop.life;
                this.ctx.font = "bold 40px sans-serif";
                this.ctx.fillStyle = "white";
                this.ctx.strokeStyle = "black";
                this.ctx.lineWidth = 4;
                this.ctx.textAlign = "center";
                this.ctx.strokeText(pop.text, pop.x, pop.y);
                this.ctx.fillText(pop.text, pop.x, pop.y);
                this.ctx.restore();
                if (pop.life <= 0) this.popups.splice(i, 1);
            }

            if (this.mouseX > 0 && this.mouseY > 0) {
                this.ctx.save();
                this.ctx.translate(this.mouseX, this.mouseY);
                if (this.isClicking) this.ctx.rotate(-Math.PI / 4);
                this.ctx.font = "60px Arial";
                this.ctx.textAlign = "center";
                this.ctx.textBaseline = "middle";
                this.ctx.fillText("🔨", 0, 0);
                this.ctx.restore();
            }

            this.animationId = requestAnimationFrame(this.loop.bind(this));
        },

        destroy: function() {
            console.log("[Modulo: Atrapa al Topo] Destruyendo...");
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }

            window.removeEventListener('resize', this.handlers.resize);
            if (this.canvas) {
                this.canvas.removeEventListener('mousemove', this.handlers.mousemove);
                this.canvas.removeEventListener('mouseleave', this.handlers.mouseleave);
                this.canvas.removeEventListener('mousedown', this.handlers.mousedown);
                this.canvas.removeEventListener('touchstart', this.handlers.touchstart);
                this.canvas.removeEventListener('touchmove', this.handlers.touchmove);
            }

            if (this.config && this.config.onExit) {
                this.config.onExit({ game: 'moles', score: this.score });
            }

            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }

            this.container = null;
            this.canvas = null;
            this.ctx = null;
            this.scoreUI = null;
            this.holes = [];
            this.particles = [];
            this.popups = [];
            this.config = null;
        }
    };

    window.initGameMoles = function() {
        GameMoles.init({
            lang: (typeof userData !== 'undefined' && userData.idioma) ? userData.idioma : 'es-ES',
            playSound: (type) => {
                if (typeof window.sonarEfecto === 'function') window.sonarEfecto(type);
            },
            onReward: (type) => {
                if (typeof window.rewardEgg === 'function') window.rewardEgg(type);
            },
            onExit: (data) => {
                if (typeof window.askGroq === 'function') {
                    window.askGroq(`[System: El niño terminó de jugar a Atrapa al Topo. Puntuación: ${data.score}. Felicítalo alegremente de forma breve por sus reflejos rápidos. IDIOMA: ${typeof userData !== 'undefined' ? userData.idioma : 'es-ES'}]`, true);
                }
            }
        });
    };
})();
