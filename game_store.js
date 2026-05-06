// game_store.js - Tienda Mágica (Arquitectura Sandbox Modular)

(function() {
    // Scope Aislado
    const GameStore = {
        config: null,
        container: null,
        handlers: {},

        // Inventario de la tienda
        catalog: [
            { id: 'manzana', nombre: 'Manzana Roja', tipo: 'comida', costo: 5, icono: '🍎', desc: '+20 Hambre' },
            { id: 'peluche', nombre: 'Oso de Peluche', tipo: 'juguete', costo: 15, icono: '🧸', desc: '+50 Felicidad' },
            { id: 'sombrero', nombre: 'Sombrero Mágico', tipo: 'cosmetico', costo: 50, icono: '🎩', desc: '¡Equipable!' }
        ],

        init: function(bridge) {
            console.log("[Modulo: Tienda] Inicializando...");
            if (document.getElementById('store-game-container')) return;

            this.config = bridge;
            window.activeKubokiModule = this;
            this.buildDOM();
            this.updateBalanceUI();

            // Escuchar cambios de estado globales para actualizar saldo en vivo
            this.handlers.onStateChange = () => this.updateBalanceUI();
            window.addEventListener('KUBOKI_STATE_CHANGED', this.handlers.onStateChange);
        },

        buildDOM: function() {
            this.container = document.createElement('div');
            this.container.id = 'store-game-container';
            this.container.className = 'store-sandbox';
            this.container.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: linear-gradient(135deg, #f39c12 0%, #d35400 100%);
                z-index: 100000; display: flex; flex-direction: column; overflow: hidden;
            `;

            // Efecto de patrón de madera de fondo (CSS trick)
            const woodPattern = document.createElement('div');
            woodPattern.style.cssText = `
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;
                background: repeating-linear-gradient( 45deg, rgba(0,0,0,0.05), rgba(0,0,0,0.05) 10px, transparent 10px, transparent 20px );
            `;
            this.container.appendChild(woodPattern);

            // Barra superior
            const topBar = document.createElement('div');
            topBar.className = 'store-topbar';
            topBar.style.cssText = `
                width: 100%; padding: 15px 20px; display: flex; justify-content: space-between;
                align-items: center; background: rgba(0, 0, 0, 0.2); backdrop-filter: blur(5px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 100001;
            `;

            const title = document.createElement('h2');
            title.innerText = '🏪 Tienda Mágica';
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

            // Indicador de saldo
            this.balanceUI = document.createElement('div');
            this.balanceUI.style.cssText = `
                background: white; color: #333; padding: 10px 20px; border-radius: 20px;
                font-weight: bold; font-size: 1.5rem; display: flex; align-items: center; gap: 10px;
                box-shadow: inset 0 3px 5px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.2);
            `;

            topBar.appendChild(title);
            topBar.appendChild(this.balanceUI);
            topBar.appendChild(btnClose);
            this.container.appendChild(topBar);

            // Contenedor de Estantes
            const shelvesArea = document.createElement('div');
            shelvesArea.style.cssText = `
                flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
                gap: 30px; padding: 20px; overflow-y: auto; z-index: 100001;
            `;
            this.container.appendChild(shelvesArea);

            // Crear Estante (Shelf)
            const shelf = document.createElement('div');
            shelf.style.cssText = `
                width: 90%; max-width: 800px; display: flex; justify-content: space-around;
                background: #8e44ad; padding: 30px 20px; border-radius: 20px;
                box-shadow: inset 0 -15px 0 rgba(0,0,0,0.2), 0 10px 20px rgba(0,0,0,0.3);
                border: 5px solid #9b59b6;
            `;

            this.catalog.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.style.cssText = `
                    background: white; border-radius: 15px; padding: 15px; display: flex; flex-direction: column;
                    align-items: center; width: 160px; box-shadow: 0 10px 15px rgba(0,0,0,0.2);
                    transition: transform 0.2s; cursor: pointer; text-align: center;
                `;

                const icon = document.createElement('div');
                icon.innerText = item.icono;
                icon.style.cssText = 'font-size: 4rem; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.2));';
                
                const name = document.createElement('div');
                name.innerText = item.nombre;
                name.style.cssText = 'font-weight: bold; margin-top: 10px; font-size: 1.1rem; color: #2c3e50;';

                const desc = document.createElement('div');
                desc.innerText = item.desc;
                desc.style.cssText = 'font-size: 0.8rem; color: #7f8c8d; margin-bottom: 10px;';

                const buyBtn = document.createElement('button');
                buyBtn.innerText = `🥚 ${item.costo}`;
                buyBtn.style.cssText = `
                    background: #f1c40f; border: 2px solid #f39c12; border-radius: 10px; padding: 5px 15px;
                    font-weight: bold; color: #d35400; cursor: pointer; width: 100%; font-size: 1.2rem;
                    box-shadow: 0 4px 0 #f39c12; transition: all 0.1s;
                `;

                // Hover & Click effects
                itemCard.onmouseenter = () => itemCard.style.transform = 'translateY(-10px)';
                itemCard.onmouseleave = () => itemCard.style.transform = 'translateY(0)';
                buyBtn.onmousedown = () => { buyBtn.style.transform = 'translateY(4px)'; buyBtn.style.boxShadow = 'none'; };
                buyBtn.onmouseup = () => { buyBtn.style.transform = 'translateY(0)'; buyBtn.style.boxShadow = '0 4px 0 #f39c12'; };
                buyBtn.onmouseleave = () => { buyBtn.style.transform = 'translateY(0)'; buyBtn.style.boxShadow = '0 4px 0 #f39c12'; };

                buyBtn.onclick = () => this.handlePurchase(item, itemCard);

                itemCard.appendChild(icon);
                itemCard.appendChild(name);
                itemCard.appendChild(desc);
                itemCard.appendChild(buyBtn);
                shelf.appendChild(itemCard);
            });

            shelvesArea.appendChild(shelf);
            document.body.appendChild(this.container);
        },

        updateBalanceUI: function() {
            if (!this.balanceUI) return;
            const balance = window.StorageManager ? window.StorageManager.getState().saldo_huevos : 0;
            this.balanceUI.innerHTML = `🥚 <span>${balance}</span>`;
            
            // Animacion pequeña al actualizar
            this.balanceUI.style.transform = 'scale(1.2)';
            setTimeout(() => { if (this.balanceUI) this.balanceUI.style.transform = 'scale(1)'; }, 200);
        },

        handlePurchase: function(item, cardElement) {
            if (!window.StorageManager) {
                alert("Storage Manager no disponible.");
                return;
            }

            if (window.StorageManager.spendHuevos(item.costo)) {
                // Compra Exitosa
                if (this.config && this.config.playSound) this.config.playSound('brillo');
                window.StorageManager.addInventario({ id: item.id, nombre: item.nombre, tipo: item.tipo, icono: item.icono });
                
                // Efecto visual de exito
                const originalBg = cardElement.style.background;
                cardElement.style.background = '#2ed573';
                setTimeout(() => { if(cardElement) cardElement.style.background = originalBg; }, 500);

            } else {
                // Compra Fallida (Sin huevos)
                if (this.config && this.config.playSound) this.config.playSound('error'); // Necesita un sonido de error, o 'pop'
                cardElement.style.animation = 'shake 0.5s';
                cardElement.style.background = '#ff4757';
                setTimeout(() => { 
                    if(cardElement) {
                        cardElement.style.animation = ''; 
                        cardElement.style.background = 'white'; 
                    }
                }, 500);
                
                // Informar a la IA que no le alcanza para que motive al niño
                if (this.config && this.config.onFailPurchase) {
                    this.config.onFailPurchase(item.nombre);
                }
            }
        },

        destroy: function() {
            console.log("[Modulo: Tienda] Destruyendo...");
            
            window.removeEventListener('KUBOKI_STATE_CHANGED', this.handlers.onStateChange);

            if (this.config && this.config.onExit) {
                this.config.onExit();
            }

            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }

            this.container = null;
            this.balanceUI = null;
            this.config = null;
        }
    };

    window.initGameStore = function() {
        GameStore.init({
            lang: (typeof userData !== 'undefined' && userData.idioma) ? userData.idioma : 'es-ES',
            playSound: (type) => {
                if (typeof window.sonarEfecto === 'function') window.sonarEfecto(type);
            },
            onFailPurchase: (itemName) => {
                if (typeof window.askGroq === 'function') {
                    window.askGroq(`[System: El niño intentó comprar ${itemName} en la tienda mágica pero no tiene suficientes Huevos de Plata. Dile amablemente que no le alcanza, y sugiérele ir a la "Zona de Juegos" a jugar Globos Locos o Atrapa al Topo para ganar más huevos. IDIOMA: ${typeof userData !== 'undefined' ? userData.idioma : 'es-ES'}]`, true);
                }
            },
            onExit: () => {
                if (typeof window.askGroq === 'function') {
                    window.askGroq(`[System: El niño acaba de salir de la Tienda Mágica. Usa el contexto global de inventario para felicitarlo por sus compras (si tiene algo nuevo) o preguntarle qué quiere hacer ahora. IDIOMA: ${typeof userData !== 'undefined' ? userData.idioma : 'es-ES'}]`, true);
                }
            }
        });
    };

    // Añadir keyframes para shake (temblor al fallar compra)
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            50% { transform: translateX(10px); }
            75% { transform: translateX(-10px); }
            100% { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);
})();
