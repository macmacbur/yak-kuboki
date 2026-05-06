// game_pet.js - Mascota Virtual (Arquitectura Sandbox Modular)

(function() {
    const GamePet = {
        config: null,
        container: null,
        avatar: null,
        handlers: {},
        inventoryItems: [],

        init: function(bridge) {
            console.log("[Modulo: Mascota] Inicializando...");
            if (document.getElementById('game-pet-container')) return;

            this.config = bridge;
            window.activeKubokiModule = this;
            
            // Verificar si tenemos StorageManager
            if (!window.StorageManager) {
                alert("Error: El Gestor de Datos (StorageManager) no está cargado.");
                return;
            }

            this.buildDOM();
            this.updateUI();

            // Escuchar cambios de estado para actualizar inventario y barras en vivo
            this.handlers.onStateChange = () => this.updateUI();
            window.addEventListener('KUBOKI_STATE_CHANGED', this.handlers.onStateChange);
            
            // Refrescar decaimiento de tiempo
            this.processTimeDecay();
        },

        processTimeDecay: function() {
            const state = window.StorageManager.getState();
            const now = Date.now();
            const lastUpdate = state.sesion.ultimo_ingreso || now;
            const hoursPassed = (now - lastUpdate) / (1000 * 60 * 60);

            if (hoursPassed > 1) {
                const penalty = Math.floor(hoursPassed * 5); // Pierde 5% por hora
                window.StorageManager.updateMascota({
                    hambre: state.mascota_estado.hambre - penalty,
                    felicidad: state.mascota_estado.felicidad - penalty
                });
                console.log(`[Modulo: Mascota] Pasaron ${hoursPassed.toFixed(1)} hrs. Penalidad: -${penalty}%`);
            }
        },

        buildDOM: function() {
            this.container = document.createElement('div');
            this.container.id = 'game-pet-container';
            this.container.className = 'pet-sandbox';
            this.container.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: url('pet_room_background.png') center/cover no-repeat, radial-gradient(circle, #fbc531, #e1b12c);
                z-index: 100000; display: flex; flex-direction: column;
                font-family: 'Comic Sans MS', sans-serif;
            `;

            // Animaciones CSS inyectadas de forma localizada
            const style = document.createElement('style');
            style.textContent = `
                .pet-sandbox .anim-bounce { animation: pet-bounce 2s infinite ease-in-out; }
                .pet-sandbox .anim-shake { animation: pet-shake 0.5s infinite; }
                .pet-sandbox .anim-happy { animation: pet-spin 1s; }
                @keyframes pet-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-30px); } }
                @keyframes pet-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
                @keyframes pet-spin { 0% { transform: rotate(0deg) scale(1.5); } 100% { transform: rotate(360deg) scale(1); } }
            `;
            this.container.appendChild(style);

            // Barra Superior
            const topBar = document.createElement('div');
            topBar.style.cssText = `
                display: flex; justify-content: space-between; align-items: center; padding: 15px 30px;
                background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(10px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.1); z-index: 100001;
            `;

            const btnClose = document.createElement('button');
            btnClose.innerText = '🏠 Volver';
            btnClose.style.cssText = `
                background: white; border: 4px solid #ff4757; color: #ff4757;
                border-radius: 50px; padding: 10px 25px; font-size: 1.5rem; font-weight: bold;
                cursor: pointer; box-shadow: 0 5px 0 #ff4757; transition: transform 0.1s;
            `;
            btnClose.onclick = () => {
                if (this.config && this.config.playSound) this.config.playSound('pop');
                this.destroy();
            };

            const headerTitle = document.createElement('div');
            headerTitle.style.textAlign = 'center';
            const nameEl = document.createElement('h2');
            const state = window.StorageManager.getState();
            nameEl.innerText = state.configuracion.nombre || "Mascota";
            nameEl.style.cssText = 'color: #ff9ff3; margin:0; text-shadow: 0 2px 5px rgba(0,0,0,0.5); font-size: 2.5rem;';
            headerTitle.appendChild(nameEl);

            this.eggCounter = document.createElement('div');
            this.eggCounter.style.cssText = `
                background: rgba(0,0,0,0.5); padding: 10px 20px; border-radius: 20px;
                color: white; font-size: 1.5rem; border: 3px solid silver; font-weight: bold;
            `;

            topBar.appendChild(btnClose);
            topBar.appendChild(headerTitle);
            topBar.appendChild(this.eggCounter);
            this.container.appendChild(topBar);

            // Area de Trabajo
            const workspace = document.createElement('div');
            workspace.style.cssText = 'flex: 1; display: flex; flex-direction: column; position: relative;';

            // Barras de estado
            const barsContainer = document.createElement('div');
            barsContainer.style.cssText = `
                display: flex; gap: 20px; justify-content: center; padding: 20px;
                background: rgba(255,255,255,0.7); margin: 20px auto; border-radius: 20px; width: 90%; max-width: 600px;
            `;

            // Hambre
            const hungerWrap = document.createElement('div');
            hungerWrap.style.cssText = 'flex: 1; text-align: center;';
            hungerWrap.innerHTML = '<div style="font-weight:bold; margin-bottom:5px;">🍎 Hambre</div>';
            const hungerBg = document.createElement('div');
            hungerBg.style.cssText = 'background: rgba(0,0,0,0.2); height: 25px; border-radius: 15px; overflow: hidden; border: 3px solid white;';
            this.hungerFill = document.createElement('div');
            this.hungerFill.style.cssText = 'background: #ff4757; height: 100%; transition: width 0.3s;';
            hungerBg.appendChild(this.hungerFill);
            hungerWrap.appendChild(hungerBg);

            // Felicidad
            const happyWrap = document.createElement('div');
            happyWrap.style.cssText = 'flex: 1; text-align: center;';
            happyWrap.innerHTML = '<div style="font-weight:bold; margin-bottom:5px;">🎾 Felicidad</div>';
            const happyBg = document.createElement('div');
            happyBg.style.cssText = 'background: rgba(0,0,0,0.2); height: 25px; border-radius: 15px; overflow: hidden; border: 3px solid white;';
            this.happyFill = document.createElement('div');
            this.happyFill.style.cssText = 'background: #2ed573; height: 100%; transition: width 0.3s;';
            happyBg.appendChild(this.happyFill);
            happyWrap.appendChild(happyBg);

            barsContainer.appendChild(hungerWrap);
            barsContainer.appendChild(happyWrap);
            workspace.appendChild(barsContainer);

            // Avatar
            const avatarContainer = document.createElement('div');
            avatarContainer.style.cssText = 'flex: 1; display: flex; justify-content: center; align-items: center;';
            
            this.avatar = document.createElement('div');
            this.avatar.innerText = '🥚';
            this.avatar.className = 'anim-bounce';
            this.avatar.style.cssText = 'font-size: 15rem; filter: drop-shadow(0 15px 15px rgba(0,0,0,0.4)); transition: transform 0.3s;';
            
            avatarContainer.appendChild(this.avatar);
            workspace.appendChild(avatarContainer);

            // INVENTARIO INTERACTIVO (Drag & Drop)
            this.inventoryPanel = document.createElement('div');
            this.inventoryPanel.style.cssText = `
                height: 150px; background: rgba(0,0,0,0.3); backdrop-filter: blur(5px);
                border-top: 5px solid rgba(255,255,255,0.5); display: flex; gap: 15px;
                padding: 20px; overflow-x: auto; align-items: center;
            `;

            const invTitle = document.createElement('div');
            invTitle.innerText = "Mochila Mágica:";
            invTitle.style.cssText = 'color: white; font-weight: bold; font-size: 1.5rem; margin-right: 20px;';
            this.inventoryPanel.appendChild(invTitle);

            workspace.appendChild(this.inventoryPanel);
            this.container.appendChild(workspace);
            document.body.appendChild(this.container);

            this.setupDragDrop();
        },

        setupDragDrop: function() {
            // Drop zone es el avatar
            const onEnd = (e) => {
                if (!this.activeDragElement) return;
                
                const clientX = e.type.includes('touch') ? e.changedTouches[0].clientX : e.clientX;
                const clientY = e.type.includes('touch') ? e.changedTouches[0].clientY : e.clientY;

                const avatarRect = this.avatar.getBoundingClientRect();
                
                // Si lo suelta sobre la mascota
                if (clientX > avatarRect.left && clientX < avatarRect.right &&
                    clientY > avatarRect.top && clientY < avatarRect.bottom) {
                    
                    const itemData = JSON.parse(this.activeDragElement.dataset.item);
                    this.consumeItem(itemData);
                    
                    // Efecto visual y destruccion del drag element
                    if (this.activeDragElement.parentNode) this.activeDragElement.parentNode.removeChild(this.activeDragElement);
                } else {
                    // Si falla, lo devuelve visualmente (se repinta al actualizar UI de todos modos)
                    if (this.activeDragElement.parentNode) this.activeDragElement.parentNode.removeChild(this.activeDragElement);
                }

                this.activeDragElement = null;
            };

            this.handlers.onMove = (e) => {
                if (!this.activeDragElement) return;
                e.preventDefault();
                const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                this.activeDragElement.style.left = (clientX - 40) + 'px';
                this.activeDragElement.style.top = (clientY - 40) + 'px';
            };

            this.handlers.onEnd = onEnd;

            this.container.addEventListener('mousemove', this.handlers.onMove);
            this.container.addEventListener('touchmove', this.handlers.onMove, { passive: false });
            this.container.addEventListener('mouseup', this.handlers.onEnd);
            this.container.addEventListener('touchend', this.handlers.onEnd);
        },

        consumeItem: function(item) {
            console.log("Consumiendo:", item);
            const state = window.StorageManager.getState();
            
            // Efecto según el tipo
            if (item.tipo === 'comida') {
                window.StorageManager.updateMascota({ hambre: state.mascota_estado.hambre + 20 });
                if (this.config && this.config.playSound) this.config.playSound('pop');
            } else if (item.tipo === 'juguete') {
                window.StorageManager.updateMascota({ felicidad: state.mascota_estado.felicidad + 50 });
                if (this.config && this.config.playSound) this.config.playSound('brillo');
            }

            // Remover del inventario
            window.StorageManager.removeInventario(item.id);

            // Reaccion animada
            this.avatar.classList.remove('anim-bounce');
            this.avatar.classList.add('anim-happy');
            setTimeout(() => {
                if (this.avatar) {
                    this.avatar.classList.remove('anim-happy');
                    this.avatar.classList.add('anim-bounce');
                }
            }, 1000);
        },

        updateUI: function() {
            if (!this.container) return;
            const state = window.StorageManager.getState();

            // Huevos
            this.eggCounter.innerText = `🥚 ${state.saldo_huevos}`;

            // Barras
            this.hungerFill.style.width = state.mascota_estado.hambre + '%';
            this.happyFill.style.width = state.mascota_estado.felicidad + '%';

            // Reacciones basicas del avatar
            if (state.mascota_estado.hambre < 30 || state.mascota_estado.felicidad < 30) {
                this.avatar.innerText = '😿'; // Triste/Hambriento
            } else {
                this.avatar.innerText = '🥚'; // Avatar base por ahora
            }

            // Renderizar Inventario
            // Limpiar solo los items, dejando el titulo
            while (this.inventoryPanel.children.length > 1) {
                this.inventoryPanel.removeChild(this.inventoryPanel.lastChild);
            }

            if (state.inventario.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.innerText = "Tu mochila está vacía. ¡Ve a la Tienda!";
                emptyMsg.style.cssText = 'color: white; font-style: italic; opacity: 0.7;';
                this.inventoryPanel.appendChild(emptyMsg);
            } else {
                state.inventario.forEach((item, index) => {
                    const el = document.createElement('div');
                    el.innerText = item.icono;
                    el.style.cssText = `
                        font-size: 3rem; background: rgba(255,255,255,0.8); border-radius: 15px;
                        width: 80px; height: 80px; display: flex; justify-content: center; align-items: center;
                        cursor: grab; box-shadow: 0 5px 10px rgba(0,0,0,0.3); transition: transform 0.2s;
                    `;
                    el.onmouseenter = () => el.style.transform = 'translateY(-5px)';
                    el.onmouseleave = () => el.style.transform = 'translateY(0)';

                    const startDrag = (e) => {
                        if (e.type === 'touchstart') e.preventDefault();
                        if (this.config && this.config.playSound) this.config.playSound('pop');
                        
                        this.activeDragElement = el.cloneNode(true);
                        this.activeDragElement.style.position = 'fixed';
                        this.activeDragElement.style.zIndex = '100005';
                        this.activeDragElement.style.pointerEvents = 'none'; // Para que el mouseup pase al elemento debajo
                        this.activeDragElement.dataset.item = JSON.stringify(item);
                        
                        document.body.appendChild(this.activeDragElement);
                        
                        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                        
                        this.activeDragElement.style.left = (clientX - 40) + 'px';
                        this.activeDragElement.style.top = (clientY - 40) + 'px';
                    };

                    el.addEventListener('mousedown', startDrag);
                    el.addEventListener('touchstart', startDrag, { passive: false });

                    this.inventoryPanel.appendChild(el);
                });
            }
        },

        destroy: function() {
            console.log("[Modulo: Mascota] Destruyendo...");
            
            window.removeEventListener('KUBOKI_STATE_CHANGED', this.handlers.onStateChange);

            if (this.container) {
                this.container.removeEventListener('mousemove', this.handlers.onMove);
                this.container.removeEventListener('touchmove', this.handlers.onMove);
                this.container.removeEventListener('mouseup', this.handlers.onEnd);
                this.container.removeEventListener('touchend', this.handlers.onEnd);
            }

            if (this.activeDragElement && this.activeDragElement.parentNode) {
                this.activeDragElement.parentNode.removeChild(this.activeDragElement);
            }

            if (this.config && this.config.onExit) {
                this.config.onExit();
            }

            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }

            this.container = null;
            this.avatar = null;
            this.inventoryPanel = null;
            this.config = null;
        }
    };

    window.initGamePet = function() {
        GamePet.init({
            lang: (typeof userData !== 'undefined' && userData.idioma) ? userData.idioma : 'es-ES',
            playSound: (type) => {
                if (typeof window.sonarEfecto === 'function') window.sonarEfecto(type);
            },
            onExit: () => {
                if (typeof window.askGroq === 'function') {
                    window.askGroq(`[System: El niño acaba de interactuar con su Mascota. Usa el contexto global para decirle cómo se siente su mascota (hambre/felicidad) de forma cariñosa. IDIOMA: ${typeof userData !== 'undefined' ? userData.idioma : 'es-ES'}]`, true);
                }
            }
        });
    };
})();
