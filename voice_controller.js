/**
 * KUBOKI VOICE CONTROLLER - HRI LAYER (BACKEND / NODE.JS)
 * Módulo para interactuar con el hardware físico de Kuboki (o su simulación en Antigravity).
 * Utiliza transcripción de audio que es enviada a la API de Gemini para extraer intenciones 
 * estructuradas en JSON (action, parameters, emotional_cue, response_text).
 */

const { triggerLaughWithEyes } = require('./emotive_sound_manager');
const { setKubokiEyes } = require('./kuboki_led_matrix');
const express = require('express');
const cors = require('cors');

// Constantes Hardware (Simulación)
const SAFETY_OVERRIDE_DISTANCE_CM = 15;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "TU_CLAVE_GEMINI_AQUI";

// Configuración API FASE 8 (HRI Webhook)
const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/hri', (req, res) => {
    if (req.body.event === 'gold_egg_celebration') {
        console.log("🌟 [HRI] Evento Web Recibido: HUEVO DE ORO. Activando hardware...");
        setKubokiEyes('#FFD700', 100); // Ojos Dorados
        triggerLaughWithEyes('hard');  // Reproducir risa fuerte en el robot físico
        res.status(200).send({ status: 'ok', msg: 'Hardware Notified' });
    } else {
        res.status(400).send({ status: 'ignored' });
    }
});

app.listen(3000, () => {
    console.log("🚀 [HRI Bridge] API Server escuchando en http://127.0.0.1:3000");
});

/**
 * Simulación del Sistema de Motores de Kuboki
 */
const kubokiChassis = {
    drive: (speed, distance, direction) => {
        console.log(`[CHASIS] Moviendo a velocidad ${speed}% por ${distance} unidades en dirección ${direction}.`);
    },
    stop: () => {
        console.log(`[CHASIS] 🛑 Parada de emergencia/Freno completado.`);
    },
    rotate: (degrees) => {
        console.log(`[CHASIS] 🔄 Rotando ${degrees} grados.`);
    }
};

/**
 * Simulación de Sensores
 */
const kubokiSensors = {
    getDistanceToObstacle: () => {
        // Devuelve una distancia simulada. A veces cerca, a veces lejos.
        return Math.floor(Math.random() * 50) + 5;
    }
};

/**
 * 1. Envía el texto transcrito (desde un WakeWord) a Gemini API,
 *    forzando que devuelva un objeto estructurado.
 */
async function analyzeIntentWithGemini(transcript) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "TU_CLAVE_GEMINI_AQUI") {
        console.error("[GEMINI] Falta configurar GEMINI_API_KEY en el entorno.");
        return null;
    }

    const systemPrompt = `Eres el cerebro de un robot infantil llamado Kuboki.
Evalúa el texto del usuario y responde EXCLUSIVAMENTE con un JSON válido usando este esquema:
{
  "action": "move|stop|rotate|check_sensor|none",
  "parameters": {
    "speed": Number, // de 0 a 100
    "distance": Number,
    "direction": String // "forward", "backward"
  },
  "response_text": "Texto amigable a leer por TTS",
  "emotional_cue": "laugh|neutral|sad|excited"
}`;

    const payload = {
        contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "user", parts: [{ text: `Usuario: ${transcript}` }] }
        ],
        generationConfig: {
            temperature: 0.1, // Baja temperatura para mantener JSON estricto
            responseMimeType: "application/json"
        }
    };

    try {
        // POST a la API REST de Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const jsonText = data.candidates[0].content.parts[0].text;
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("[GEMINI] Error interpretando la intención profunda:", e);
        return null;
    }
}

/**
 * 2. Mapeador de acciones: Traduce el JSON a comandos de hardware y TTS
 */
async function executeRobotCommand(intentJson) {
    if (!intentJson) return;

    console.log("\n⚡ [KUBOKI CORE] Procesando intención:", JSON.stringify(intentJson));

    // A. Hablar la respuesta (Simulado aquí via console log antes de implementar Google TTS)
    // En producción se conectaría a un altavoz vía aplay o Google TTS API.
    console.log(`[ALTAVOZ TTS]: "${intentJson.response_text}"`);

    // B. Reacción Emocional Asíncrona (Si la IA lo marca como 'laugh')
    if (intentJson.emotional_cue === 'laugh') {
        const intensity = intentJson.parameters && intentJson.parameters.speed > 50 ? 'hard' : 'light';
        // Esto arranca la matriz LED y el archivo mp3 del emotive_sound_manager.js concurrentemente
        triggerLaughWithEyes(intensity);
    }

    // C. Control Fisico / Seguridad
    const action = intentJson.action;
    const params = intentJson.parameters || {};

    // Interruptor de seguridad de proximidad
    const currentDistance = kubokiSensors.getDistanceToObstacle();
    if (action === 'move' && params.direction === 'forward' && currentDistance < SAFETY_OVERRIDE_DISTANCE_CM) {
        console.warn(`[SEGURIDAD] Peligro. Objeto a ${currentDistance}cm. Abortando 'move'.`);
        kubokiChassis.stop();
        return;
    }

    switch (action) {
        case 'move':
            kubokiChassis.drive(params.speed || 50, params.distance || 10, params.direction || 'forward');
            break;
        case 'rotate':
            kubokiChassis.rotate(params.speed || 90); // Asumiendo que params.speed en rotate actúa como angle
            break;
        case 'stop':
            kubokiChassis.stop();
            break;
        case 'check_sensor':
            console.log(`[SENSOR] Comprobación solicitada. Distancia actual: ${currentDistance}cm.`);
            break;
        case 'none':
        default:
            console.log(`[CHASIS] Ninguna acción física requerida.`);
            break;
    }
}

/**
 * FLUJO PRINCIPAL EJEMPLO (Simula que el WakeWord escuchó algo)
 */
async function processVoiceCommand(transcribedText) {
    console.log(`\n🎤 [MICROFONO] Recibido: "${transcribedText}"`);
    console.log("... Consultando HRI Gemini ...");

    // 1. Obtener JSON Semántico
    const intent = await analyzeIntentWithGemini(transcribedText);

    // 2. Transmitir acciones al hardware
    await executeRobotCommand(intent);
}

module.exports = {
    processVoiceCommand,
    executeRobotCommand,
    analyzeIntentWithGemini
};

// ============================================
// BLOQUE DE PRUEBA LOCAL BÁSICA 
// ============================================
if (require.main === module) {
    // Si ejecutas "node voice_controller.js" simulará un dictado
    setTimeout(() => {
        processVoiceCommand("Kuboki, muévete un poco hacia adelante, pero con cuidado por favor.");
    }, 1000);
}
