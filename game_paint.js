/**
 * GAME PAINT - KUBOKI (Premium UI)
 * Módulo interactivo de dibujo diseñado para 1-7 años.
 */

window.initGamePaint = function() {
    console.log("[Game Paint] Inicializando UI Premium...");
    
    let container = document.getElementById('game-paint-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'game-paint-container';
        
        // UI Styles inyectados directamente
        const style = document.createElement('style');
        style.textContent = `
            #game-paint-container {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: url('kids_magic_background.png') center/cover no-repeat;
                z-index: 9999; display: flex; flex-direction: column;
                font-family: 'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif;
            }
            .gp-header {
                display: flex; justify-content: space-between; padding: 15px 30px;
                background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(10px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .gp-btn {
                background: white; border: 4px solid var(--primary-color, #9333ea);
                border-radius: 50px; padding: 10px 25px; font-size: 1.5rem; font-weight: bold;
                cursor: pointer; box-shadow: 0 5px 0 var(--primary-color, #9333ea);
                transition: transform 0.1s, box-shadow 0.1s;
                display: flex; align-items: center; gap: 10px;
            }
            .gp-btn:active { transform: translateY(5px); box-shadow: 0 0 0 var(--primary-color, #9333ea); }
            
            .gp-workspace { flex: 1; display: flex; padding: 20px; gap: 20px; overflow: hidden; }
            
            .gp-sidebar {
                width: 120px; background: rgba(255,255,255,0.7); border-radius: 20px;
                display: flex; flex-direction: column; align-items: center; padding: 15px 0; gap: 15px;
                overflow-y: auto; box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
            }
            .gp-color {
                width: 60px; height: 60px; border-radius: 50%; border: 4px solid white;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2); cursor: pointer; transition: transform 0.2s;
            }
            .gp-color.active { transform: scale(1.2); border-color: #ffd700; }
            .gp-glitter { background: linear-gradient(45deg, #ff00cc, #3333ff, #00ffcc); animation: rotateG 2s linear infinite; }
            @keyframes rotateG { 100% { filter: hue-rotate(360deg); } }
            
            .gp-canvas-wrapper {
                flex: 1; background: white; border-radius: 30px; border: 8px solid white;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2); overflow: hidden;
                position: relative; display: flex; justify-content: center; align-items: center;
            }
            #gp-canvas, #gp-glitter-canvas { position: absolute; top: 0; left: 0; touch-action: none; }
            #gp-glitter-canvas { pointer-events: none; }
            
            .gp-gallery {
                height: 120px; background: rgba(255, 255, 255, 0.6); display: flex;
                gap: 15px; padding: 15px; overflow-x: auto; align-items: center;
            }
            .gp-template {
                min-width: 90px; height: 90px; background: white; border-radius: 15px;
                border: 3px dashed #ccc; cursor: pointer; display: flex; justify-content: center; align-items: center;
                font-size: 2rem; transition: transform 0.2s;
            }
            .gp-template:hover { transform: scale(1.1); border-color: var(--primary-color, #9333ea); }
            
            #gp-onboarding {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.7); display: flex; flex-direction: column;
                justify-content: center; align-items: center; color: white; z-index: 10;
            }
            .gp-hand { font-size: 5rem; animation: swipe 2s infinite ease-in-out; }
            @keyframes swipe { 0% { transform: translateX(-50px) translateY(50px); } 50% { transform: translateX(50px) translateY(-50px); } 100% { transform: translateX(-50px) translateY(50px); } }
            
            /* -- MOBILE RESPONSIVENESS -- */
            @media (max-width: 768px) {
                .gp-header { flex-direction: column; padding: 10px; gap: 10px; }
                .gp-btn { font-size: 1rem; padding: 8px 15px; justify-content: center; width: 100%; }
                .gp-header > div { flex-wrap: wrap; width: 100%; }
                .gp-header > div > button { flex: 1; }
                .gp-workspace { flex-direction: column; padding: 10px; gap: 10px; }
                .gp-sidebar { flex-direction: row; width: 100%; height: auto; overflow-x: auto; padding: 10px; border-radius: 10px; }
                .gp-color { min-width: 40px; height: 40px; }
            }
        `;
        document.head.appendChild(style);

        container.innerHTML = `
            <div class="gp-header">
                <button class="gp-btn" id="gp-btn-close" style="border-color:#ff4757; color:#ff4757;">🏠 Volver</button>
                <div style="display:flex; gap:15px;">
                    <button class="gp-btn" id="gp-btn-clear">🗑️ Limpiar</button>
                    <button class="gp-btn" id="gp-btn-print" style="border-color:#1e90ff; color:#1e90ff;">🖨️ Imprimir</button>
                    <button class="gp-btn" id="gp-btn-save" style="border-color:#2ed573; color:#2ed573;">📸 Guardar</button>
                </div>
            </div>
            
            <div class="gp-workspace">
                <div class="gp-sidebar">
                    <div class="gp-color active" data-color="#000000" style="background:#000000;"></div>
                    <div class="gp-color" data-color="#ff4757" style="background:#ff4757;"></div>
                    <div class="gp-color" data-color="#ffa502" style="background:#ffa502;"></div>
                    <div class="gp-color" data-color="#2ed573" style="background:#2ed573;"></div>
                    <div class="gp-color" data-color="#1e90ff" style="background:#1e90ff;"></div>
                    <div class="gp-color" data-color="#9333ea" style="background:#9333ea;"></div>
                    <div class="gp-color gp-glitter" data-color="GLITTER" title="Pincel Mágico"></div>
                    <div class="gp-color" data-color="ERASER" style="background:white; display:flex; justify-content:center; align-items:center; font-size:1.8rem;">🧽</div>
                </div>
                
                <div class="gp-canvas-wrapper" id="canvas-wrapper">
                    <canvas id="gp-canvas"></canvas>
                    <canvas id="gp-glitter-canvas"></canvas>
                    
                    <div id="gp-onboarding" style="display:none;">
                        <h1 style="font-size: 3rem; text-shadow: 0 0 20px gold;">¡Pinta con tus dedos!</h1>
                        <div class="gp-hand">👆</div>
                        <button class="gp-btn" id="btn-close-onboard" style="margin-top:40px; font-size: 2rem;">¡Entendido!</button>
                    </div>
                </div>
            </div>
            
            <div class="gp-gallery" id="gp-gallery">
                <!-- Se inyectan 10 plantillas dinámicamente -->
            </div>
        `;
        document.body.appendChild(container);
        
        initCanvasLogic();
    }
    
    container.style.display = 'flex';
};

function initCanvasLogic() {
    const canvas = document.getElementById('gp-canvas');
    const gCanvas = document.getElementById('gp-glitter-canvas');
    const wrapper = document.getElementById('canvas-wrapper');
    const ctx = canvas.getContext('2d');
    const gCtx = gCanvas.getContext('2d');
    
    // Resize
    const resize = () => {
        const w = wrapper.clientWidth;
        const h = wrapper.clientHeight;
        canvas.width = w; canvas.height = h;
        gCanvas.width = w; gCanvas.height = h;
        // Restaurar blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        loadAutosave();
    };
    window.addEventListener('resize', resize);
    setTimeout(resize, 100);

    // Estado
    let painting = false;
    let currentColor = '#000000';
    let isGlitter = false;
    let isEraser = false;

    // Colores
    document.querySelectorAll('.gp-color').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.gp-color').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const col = btn.dataset.color;
            isGlitter = (col === 'GLITTER');
            isEraser = (col === 'ERASER');
            if (!isGlitter && !isEraser) currentColor = col;
        };
    });

    // Dibujo
    const startPos = { x: 0, y: 0 };
    
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e) => {
        painting = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        startPos.x = pos.x; startPos.y = pos.y;
    };

    const draw = (e) => {
        if (!painting) return;
        const pos = getPos(e);
        
        if (isGlitter) {
            drawGlitter(pos.x, pos.y);
        } else {
            ctx.lineWidth = isEraser ? 40 : 15;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = isEraser ? '#ffffff' : currentColor;
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
        startPos.x = pos.x; startPos.y = pos.y;
    };

    const stopDraw = () => {
        if (painting) {
            painting = false;
            saveAutosave();
        }
    };

    // Efecto Glitter (Estrellitas coloridas)
    const drawGlitter = (x, y) => {
        const colors = ['#ff00cc', '#3333ff', '#00ffcc', '#ffd700', '#ff4757'];
        const numStars = 3;
        for(let i=0; i<numStars; i++) {
            const offsetX = (Math.random() - 0.5) * 40;
            const offsetY = (Math.random() - 0.5) * 40;
            const size = Math.random() * 8 + 2;
            
            // Dibujar en el canvas principal para persistencia
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, size/2, 0, Math.PI*2);
            ctx.fill();
        }
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseout', stopDraw);
    
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e); }, {passive: false});
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, {passive: false});
    canvas.addEventListener('touchend', stopDraw);

    // Botones Header
    document.getElementById('gp-btn-clear').onclick = () => {
        if (confirm("¿Limpiar todo el dibujo?")) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            saveAutosave();
        }
    };

    document.getElementById('gp-btn-close').onclick = () => {
        document.getElementById('game-paint-container').style.display = 'none';
        if (window.askGroq && typeof userData !== 'undefined') {
            window.askGroq(`[System Message: El niño cerró la pantalla de arte. Felicítalo por pintar tan lindo. PREGUNTA: ¿Qué quieres hacer ahora? IDIOMA: ${userData.idioma}]`);
        }
    };

    document.getElementById('gp-btn-save').onclick = async () => {
        const link = document.createElement('a');
        link.download = 'Kuboki_Arte_Magico.png';
        const dataUrl = canvas.toDataURL('image/png');
        link.href = dataUrl;
        link.click();
        
        // Integración con Supabase Storage (V3)
        if (window.supabaseClient && window.StorageManager && window.StorageManager.state.jugador_id) {
            try {
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const fileName = `${window.StorageManager.state.jugador_id}/dibujo_${Date.now()}.png`;
                
                const { data, error } = await window.supabaseClient.storage
                    .from('kuboki_arte')
                    .upload(fileName, blob, { contentType: 'image/png', upsert: true });
                    
                if (error) console.warn("[Game Paint] Falló la subida a Supabase:", error);
                else console.log("[Game Paint] Arte respaldado en la Nube Mágica:", fileName);
            } catch (e) {
                console.warn("[Game Paint] No hay conexión para respaldo:", e);
            }
        }

        // Recompensa de Huevo de Plata
        if (window.StorageManager) {
            window.StorageManager.addHuevos(1);
            if (typeof sonarEfecto === 'function') sonarEfecto('brillo');
            console.log('¡Huevo de plata ganado por pintar!');
        } else if (typeof rewardEgg === 'function') {
            rewardEgg('silver');
        }
    };

    document.getElementById('gp-btn-print').onclick = () => {
        const dataUrl = canvas.toDataURL();
        const win = window.open();
        win.document.write('<img src="' + dataUrl + '" style="width:100%;"/>');
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 500);
    };

    // Plantillas (8 slots detectados)
    const gallery = document.getElementById('gp-gallery');
    for (let i = 1; i <= 8; i++) {
        const t = document.createElement('div');
        t.className = 'gp-template';
        // Mostrar la miniatura de la plantilla como fondo del botón
        t.style.background = `url('plantilla_${i}.png') center/contain no-repeat white`;
        t.style.border = '3px solid #ccc';
        
        t.onclick = () => {
            if (confirm("¿Quieres cargar este dibujo? (Esto no borrará lo que ya pintaste)")) {
                const img = new Image();
                img.src = `plantilla_${i}.png`;
                img.onload = () => {
                    // Dibujar la plantilla ajustada al tamaño de la pantalla
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    saveAutosave();
                }
            }
        };
        gallery.appendChild(t);
    }

    // Onboarding
    if (!localStorage.getItem('kuboki_paint_onboarding_done')) {
        document.getElementById('gp-onboarding').style.display = 'flex';
        document.getElementById('btn-close-onboard').onclick = () => {
            document.getElementById('gp-onboarding').style.display = 'none';
            localStorage.setItem('kuboki_paint_onboarding_done', 'true');
        };
    }

    // Auto-Save Functions
    function saveAutosave() {
        localStorage.setItem('kuboki_last_drawing', canvas.toDataURL());
    }

    function loadAutosave() {
        const data = localStorage.getItem('kuboki_last_drawing');
        if (data) {
            const img = new Image();
            img.src = data;
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
        }
    }
}
