/**
 * KUBOKI EMOTIVE SYSTEM - EYES & VOICE
 * Gestiona la sincronización de audio (GitHub) con el sistema de iluminación
 * LED de los ojos de Kuboki para una respuesta emocional completa.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { animateLaughterSequence, setKubokiEyes } = require('./kuboki_led_matrix'); // Integración Fase 3

// Configuración de Hardware (Simulada para Antigravity)
const EYES_COLORS = {
    LAUGH_BRIGHT: "#00FFCC", // Turquesa brillante para alegría
    LAUGH_SOFT: "#0088AA",   // Azul suave para risa leve
    ERROR: "#FF0000",        // Rojo
    IDLE: "#FFFFFF"          // Blanco (Estado de espera)
};

const GITHUB_REPO_RAW_URL = "https://raw.githubusercontent.com/usuario/repo-risas/main/audio/";
const CACHE_DIR = path.join(__dirname, 'cache_audio');

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

/**
 * Descarga y sincronización de Risas con Ojos (Integrado a Matriz LED)
 */
async function triggerLaughWithEyes(type = 'light') {
    const fileName = type === 'hard' ? "risa_carcajada.mp3" : "risa_ligera.mp3";
    const localPath = path.join(CACHE_DIR, fileName);

    try {
        // 1. Asegurar archivo en caché
        if (!fs.existsSync(localPath)) {
            console.log(`[Cache] Descargando ${fileName} desde GitHub...`);
            await new Promise((res, rej) => {
                const file = fs.createWriteStream(localPath);
                https.get(GITHUB_REPO_RAW_URL + fileName, (resp) => {
                    resp.pipe(file);
                    file.on('finish', () => { file.close(); res(); });
                }).on('error', rej);
            });
        }

        // 2. Ejecutar Sincronía (Ojos + Audio)
        console.log(`[Kuboki] Iniciando secuencia emocional avanzada: ${type}`);

        // Llamar a la biblioteca de Matrices 8x8 importada
        animateLaughterSequence();

        exec(`mpg123 ${localPath}`, (err) => {
            if (err) console.error("Error de audio:", err);
            console.log("[Kuboki] Secuencia finalizada.");
        });

    } catch (error) {
        setKubokiEyes(EYES_COLORS.ERROR, 100);
        console.error("Fallo en el sistema emotivo:", error);
    }
}

// Ejemplo de integración con el motor de Antigravity
module.exports = { triggerLaughWithEyes, setKubokiEyes };

// Prueba: Risa fuerte con ojos turquesa parpadeantes
// triggerLaughWithEyes('hard');
