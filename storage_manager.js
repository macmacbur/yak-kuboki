// storage_manager.js - Gestor Central de Datos del Ecosistema Kuboki

(function() {
    const STORAGE_KEY = 'KUBOKI_USER_DATA';

    // Estado base por defecto
    const DEFAULT_STATE = {
        saldo_huevos: 0,
        inventario: [], // Ej: [{ id: 'manzana', nombre: 'Manzana Roja', tipo: 'comida' }]
        mascota_estado: {
            hambre: 100, // 100 = lleno, 0 = hambriento
            felicidad: 100, // 100 = feliz, 0 = triste
            item_equipado: null
        },
        logros: {
            balloons_record: 0,
            moles_record: 0,
            piano_notas: 0,
            caras_armadas: 0
        },
        configuracion: {
            nombre: 'Amiguito',
            edad: 3,
            idioma: 'es-ES'
        },
        sesion: {
            tiempo_jugado_minutos: 0,
            ultimo_ingreso: null
        }
    };

    const StorageManager = {
        state: null,

        /**
         * Protocolo de Recuperacion
         */
        init: function() {
            console.log("[StorageManager] Inicializando memoria de sesion...");
            const data = localStorage.getItem(STORAGE_KEY);
            
            if (data) {
                try {
                    this.state = JSON.parse(data);
                    // Merge con DEFAULT_STATE por si hay propiedades nuevas en el código
                    this.state = { ...DEFAULT_STATE, ...this.state };
                    
                    // Asegurar sub-objetos anidados
                    this.state.mascota_estado = { ...DEFAULT_STATE.mascota_estado, ...(this.state.mascota_estado || {}) };
                    this.state.logros = { ...DEFAULT_STATE.logros, ...(this.state.logros || {}) };
                    this.state.configuracion = { ...DEFAULT_STATE.configuracion, ...(this.state.configuracion || {}) };
                    this.state.sesion = { ...DEFAULT_STATE.sesion, ...(this.state.sesion || {}) };

                    console.log("[StorageManager] Perfil cargado exitosamente.");
                } catch(e) {
                    console.error("[StorageManager] Error leyendo memoria corrupta, reseteando...", e);
                    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
                }
            } else {
                console.log("[StorageManager] No hay perfil previo. Creando nuevo...");
                this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
            }
            
            this.state.sesion.ultimo_ingreso = Date.now();
            
            // Generar UUID anónimo si no existe (Privacy By Design / COPPA)
            if (!this.state.jugador_id) {
                this.state.jugador_id = crypto.randomUUID ? crypto.randomUUID() : 'id_' + Date.now() + Math.random().toString(36).substr(2, 9);
            }
            
            this.save();
        },

        /**
         * Sincronización con Supabase (Cerebro y Datos V3)
         */
        syncToSupabase: async function() {
            // Solo sincroniza si Supabase está inicializado en la ventana
            if (window.supabaseClient) {
                try {
                    const { data, error } = await window.supabaseClient
                        .from('kuboki_jugadores')
                        .upsert({
                            id: this.state.jugador_id,
                            nombre: this.state.configuracion.nombre,
                            edad: this.state.configuracion.edad,
                            idioma: this.state.configuracion.idioma,
                            estado_completo: this.state,
                            ultima_conexion: new Date().toISOString()
                        });
                    if (error) console.error("[StorageManager] Error sincronizando a Supabase:", error);
                    else console.log("[StorageManager] Datos sincronizados a Supabase con éxito.");
                } catch (e) {
                    console.error("[StorageManager] Fallo en la red con Supabase:", e);
                }
            }
        },

        /**
         * Persistencia Inmediata
         */
        save: function() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
            
            // Sincronizar silenciosamente a la base de datos
            this.syncToSupabase();

            // Emitir evento para que React/UI/IA se enteren del cambio en tiempo real
            const event = new CustomEvent('KUBOKI_STATE_CHANGED', { detail: this.state });
            window.dispatchEvent(event);
        },

        /**
         * Obtener todo el estado
         */
        getState: function() {
            return this.state;
        },

        /**
         * Operaciones de Economía
         */
        addHuevos: function(cantidad) {
            this.state.saldo_huevos += cantidad;
            this.save();
            return this.state.saldo_huevos;
        },

        spendHuevos: function(cantidad) {
            if (this.state.saldo_huevos >= cantidad) {
                this.state.saldo_huevos -= cantidad;
                this.save();
                return true;
            }
            return false;
        },

        /**
         * Operaciones de Inventario
         */
        addInventario: function(item) {
            this.state.inventario.push(item);
            this.save();
        },

        removeInventario: function(itemId) {
            const index = this.state.inventario.findIndex(i => i.id === itemId);
            if (index > -1) {
                this.state.inventario.splice(index, 1);
                this.save();
                return true;
            }
            return false;
        },

        /**
         * Operaciones de Mascota
         */
        updateMascota: function(updates) {
            this.state.mascota_estado = { ...this.state.mascota_estado, ...updates };
            // Limitar rangos
            if (this.state.mascota_estado.hambre > 100) this.state.mascota_estado.hambre = 100;
            if (this.state.mascota_estado.hambre < 0) this.state.mascota_estado.hambre = 0;
            if (this.state.mascota_estado.felicidad > 100) this.state.mascota_estado.felicidad = 100;
            if (this.state.mascota_estado.felicidad < 0) this.state.mascota_estado.felicidad = 0;
            this.save();
        },

        /**
         * Operaciones de Logros (Récords)
         */
        updateLogro: function(juego, valor) {
            if (this.state.logros[juego] !== undefined) {
                // Solo guardamos si es un nuevo récord o si acumula
                if (juego === 'piano_notas' || juego === 'caras_armadas') {
                    this.state.logros[juego] += valor;
                } else {
                    if (valor > this.state.logros[juego]) {
                        this.state.logros[juego] = valor;
                    }
                }
                this.save();
            }
        },

        /**
         * Generador de String para el Prompt de la IA
         */
        getAIPromptContext: function() {
            const s = this.state;
            const items = s.inventario.map(i => i.nombre).join(', ') || 'ninguno';
            const mascotaStatus = `Hambre: ${s.mascota_estado.hambre}%, Felicidad: ${s.mascota_estado.felicidad}%`;
            return `[JSON DE ESTADO EN TIEMPO REAL: El niño/a se llama ${s.configuracion.nombre} (${s.configuracion.edad} años). Saldo actual: ${s.saldo_huevos} Huevos de Plata. Inventario comprado: ${items}. Estado de su Mascota Virtual: ${mascotaStatus}.]`;
        }
    };

    // Inicializar de inmediato (Nivel Bloque estático)
    StorageManager.init();

    // Exponer al scope global para que los Bloques Sandboxes (Juegos, Tienda, IA) puedan comunicarse con él
    window.StorageManager = StorageManager;
})();
