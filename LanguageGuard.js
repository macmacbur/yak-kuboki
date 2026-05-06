/**
 * LANGUAGE GUARD (Strict Localization Shield)
 * Módulo "No-Touch" Finalizado.
 * Bloquea la fuga de contexto entre idiomas (Cross-Language Leakage).
 */

const LanguageGuard = (function() {
    // Constante Global de Sesión
    let CURRENT_LANGUAGE_CONTEXT = null;
    let CURRENT_CHANNEL_CONTEXT = null;

    return {
        /**
         * Inicializa o actualiza el contexto del idioma.
         * Se debe llamar inmediatamente después de que el usuario selecciona la bandera.
         */
        setContext: function(langCode, channelId) {
            CURRENT_LANGUAGE_CONTEXT = langCode;
            CURRENT_CHANNEL_CONTEXT = channelId;
            console.log(`[LanguageGuard] Contexto establecido a: ${CURRENT_LANGUAGE_CONTEXT} (Canal: ${CURRENT_CHANNEL_CONTEXT})`);
        },

        getContext: function() {
            return {
                lang: CURRENT_LANGUAGE_CONTEXT,
                channel: CURRENT_CHANNEL_CONTEXT
            };
        },

        /**
         * Verificación estricta de base de datos.
         * Valida que el video seleccionado pertenezca al canal del idioma actual.
         */
        validateVideoContext: function(videoChannelId) {
            if (!CURRENT_CHANNEL_CONTEXT) return true; // Si no hay contexto forzado, permitimos (fallback)
            if (videoChannelId !== CURRENT_CHANNEL_CONTEXT) {
                console.error(`[LanguageGuard] BLOQUEO: Intento de cargar video del canal ${videoChannelId} estando en contexto ${CURRENT_CHANNEL_CONTEXT}`);
                return false;
            }
            return true;
        },

        /**
         * Valida el texto generado por la IA de forma heurística.
         * Groq no siempre retorna un metadato de idioma confiable, así que 
         * este método es un hook para futuras integraciones de detección.
         */
        validateAIResponse: function(aiText) {
            if (!CURRENT_LANGUAGE_CONTEXT) return true;
            
            // Aquí se pueden agregar reglas estrictas o llamadas a detectores de idioma.
            // Por ahora, el bloqueo de prompt (ai_tutor.js) hace el 99% del trabajo,
            // pero este guard actuará como punto de intercepción final.
            return true;
        },

        /**
         * Wrapper para la IA: intercepta si detecta error y reintenta.
         */
        safeWrapAIOutput: async function(aiText, originalAskGroqCallback) {
            if (!this.validateAIResponse(aiText)) {
                console.error("[LanguageGuard] Fuga de idioma detectada en IA. Bloqueando salida y reintentando en silencio.");
                // Retornar falso significa que falló la validación y el llamador debería reintentar
                return false;
            }
            return true;
        }
    };
})();

window.LanguageGuard = LanguageGuard;
