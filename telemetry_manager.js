// telemetry_manager.js - Módulo de Telemetría Estratégica (COPPA Compliant)

(function() {
    const BUFFER_KEY = 'KUBOKI_TELEMETRY_BUFFER';
    const SEND_INTERVAL = 60000; // Intentar enviar cada 60 segundos
    
    const Telemetry = {
        buffer: [],
        sessionStart: Date.now(),
        
        init: function() {
            console.log("[Telemetría] Inicializando Sensor Estratégico...");
            const saved = localStorage.getItem(BUFFER_KEY);
            if (saved) {
                try {
                    this.buffer = JSON.parse(saved);
                } catch(e) { this.buffer = []; }
            }

            // Registrar apertura de app
            this.track('APP_OPEN', { 
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                userAgent: navigator.userAgent.substring(0, 50) // Anonimizado
            });

            // Arrancar el loop de envío silencioso
            setInterval(() => this.flush(), SEND_INTERVAL);
            
            // Intentar enviar si el navegador se cierra
            window.addEventListener('beforeunload', () => {
                this.track('APP_CLOSE', { sessionTimeSecs: Math.floor((Date.now() - this.sessionStart)/1000) });
                this.saveBuffer();
                // Opcional: sendBeacon para enviar antes de morir
                if (this.buffer.length > 0 && navigator.sendBeacon) {
                    // SendBeacon hacia una URL (requeriría un endpoint Edge si no usamos Supabase cliente)
                }
            });
        },

        track: function(eventType, eventData = {}) {
            const state = window.StorageManager ? window.StorageManager.getState() : {};
            const lang = (state.configuracion && state.configuracion.idioma) ? state.configuracion.idioma : navigator.language;
            
            const payload = {
                event_type: eventType,
                event_data: eventData,
                language: lang,
                country_inferred: Intl.DateTimeFormat().resolvedOptions().timeZone, // Sirve de proxy de país anónimo
                timestamp: new Date().toISOString()
            };

            this.buffer.push(payload);
            this.saveBuffer();
        },

        saveBuffer: function() {
            localStorage.setItem(BUFFER_KEY, JSON.stringify(this.buffer));
        },

        flush: async function() {
            if (this.buffer.length === 0) return;
            if (!navigator.onLine) return; // Si no hay internet, se queda en buffer
            
            if (window._supabase) {
                console.log(`[Telemetría] Enviando paquete de ${this.buffer.length} eventos a Supabase...`);
                try {
                    const { error } = await window._supabase
                        .from('kuboki_telemetry')
                        .insert(this.buffer);
                        
                    if (!error) {
                        this.buffer = []; // Vaciar tras éxito
                        this.saveBuffer();
                    }
                } catch (e) {
                    console.error("[Telemetría] Falló envío, se retiene en buffer.", e);
                }
            }
        }
    };

    // Auto-arranque silencioso
    Telemetry.init();

    // Exponer globalmente
    window.Telemetry = Telemetry;
})();
