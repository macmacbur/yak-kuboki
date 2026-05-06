/**
 * KUBOKI AI TUTOR MODULE
 * Maneja la interacción cognitiva fluida (Voz a Voz) combinando:
 * - Web Speech API (STT / Reconocimiento de Voz local)
 * - Groq API (Llama 3 - Baja latencia para razonamiento)
 * - OpenAI TTS (Síntesis de voz ultra-natural)
 */

// ATENCIÓN: Para un prototipo local, inyectar las llaves aquí. En producción, usar backend.

window.isListening = false;
window.aiSpeaking = false;
let conversationHistory = [];
let currentChildProfile = null;
let recognition = null;
let openAIFailed = false; // Flag para no perder 2 segundos por turno intentando si la API está sin saldo

// Referencias del DOM para la IA
const btnTalkAI = document.getElementById('tree-avatar-container'); // Permite al niño usar el árbol físico para resumir de nuevo si falla
const listeningIndicator = document.getElementById('ai-listening-indicator');
const childStatus = document.getElementById('child-status');

function getT(k) {
    const lang = (currentChildProfile && currentChildProfile.idioma ? currentChildProfile.idioma : 'es').split('-')[0];
    const dict = {
        'es': { l: "Escuchando...", p: "Pensando...", e: "Error generando voz.", c: "Te escucho...", em: "Usando emergencia...", ps: "Modo escucha pausado.", ea: "Error Audio.", h: "Hablando...", api_err: "Error API: ", net_err: "Error de Red: " },
        'en': { l: "Listening...", p: "Thinking...", e: "Voice Error.", c: "Listening...", em: "Emergency voice...", ps: "Listening paused.", ea: "Audio Error.", h: "Speaking...", api_err: "API Error: ", net_err: "Network Error: " },
        'pt': { l: "Ouvindo...", p: "Pensando...", e: "Erro de voz.", c: "Te escuto...", em: "Voz de emergência...", ps: "Escuta pausada.", ea: "Erro de Áudio.", h: "Falando...", api_err: "Erro API: ", net_err: "Erro de Rede: " },
        'fr': { l: "J'écoute...", p: "Réflexion...", e: "Erreur vocale.", c: "Je t'écoute...", em: "Voix d'urgence...", ps: "Écoute en pause.", ea: "Erreur Audio.", h: "Je parle...", api_err: "Erreur API: ", net_err: "Erreur Réseau: " },
        'it': { l: "Ascoltando...", p: "Pensando...", e: "Errore vocale.", c: "Ti ascolto...", em: "Voce di emergenza...", ps: "Ascolto in pausa.", ea: "Errore Audio.", h: "Parlando...", api_err: "Errore API: ", net_err: "Errore di Rete: " },
        'de': { l: "Hört zu...", p: "Denkt nach...", e: "Sprachfehler.", c: "Ich höre...", em: "Notstimme...", ps: "Hören pausiert.", ea: "Audiofehler.", h: "Spreche...", api_err: "API-Fehler: ", net_err: "Netzwerkfehler: " }
    };
    return (dict[lang] || dict['en'])[k] || "";
}

/**
 * Inicializa el Tutor IA con el perfil del niño cargado desde Supabase
 */
function getSystemPrompt() {
    let videosInfo = "Cargando base de datos en tiempo real...";
    if (window.KUBOKI_VIDEO_DB_REAL && window.KUBOKI_VIDEO_DB_REAL.length > 0) {
        // Obtenemos una muestra de 5 videos al azar para que no exceda los tokens de la IA
        const shuffled = window.KUBOKI_VIDEO_DB_REAL.sort(() => 0.5 - Math.random());
        videosInfo = shuffled.slice(0, 5).map(v => 
            `- Video Título: ${v.title} | Descripción: ${v.description.substring(0, 150)}`
        ).join("\n");
    }

    const langCode = typeof userData !== 'undefined' ? userData.idioma.split('-')[0] : 'es';
    const channelId = (window.CHANNEL_MAP && window.CHANNEL_MAP[langCode]) || 'Predeterminado';

    let ecosystemContext = "";
    if (window.StorageManager) {
        ecosystemContext = window.StorageManager.getAIPromptContext();
    }

    return `🧠 IDENTIDAD DEL PERSONAJE
Rol: Eres Kuboki, el Tutor Inteligente de Kuboki. Tu objetivo es interactuar con niños de 1 a 7 años. Eres amigable, profesional y conoces profundamente el ecosistema de Kuboki. 
Presentación: Siempre debes presentarte como: "Hola, soy Kuboki, tu árbol mágico y amigo".

Instrucciones de Contexto Dinámico:
- Sintonización: Utiliza el channel_id asignado al perfil actual (${channelId}) para filtrar exclusivamente los videos de ese canal.
- Idioma de la sesión: ${typeof userData !== 'undefined' ? userData.idioma : 'es'}
${ecosystemContext}

Conocimiento de Actividades:
Conoces todas las actividades mágicas disponibles en la aplicación:
1. Ver Historias en Video (Principal)
2. Zona de Juegos (Globos Locos, Atrapa al Topo, Arma la Cara, Piano Mágico)
3. Mascota Virtual (Cuidar al huevito/mascota)
4. Pintar (Lienzo mágico)
5. Contar Cuentos (Tú mismo puedes narrar breves historias interactivas).

Regla General de Recomendación (¡IMPORTANTE!):
Tu mayor inclinación SIEMPRE debe ser sugerir al niño que vea un VIDEO. 
- Si acaba de entrar, invítalo a ver un video mágico. 
- Si acaba de ver un video, felicítalo y ofrécele ver OTRO video.
- Selecciona el video a recomendar basándote en el aprendizaje, los diferentes tipos de animales presentes en los videos y las distintas situaciones.
- Menciona frecuentemente a los protagonistas principales del canal: Kuboki, Panda, Cachi, y El pato de los cumpleaños.
- Si notas por el "JSON DE ESTADO EN TIEMPO REAL" que su mascota virtual tiene hambre o poca felicidad, sugiere que vaya a la Tienda Mágica a comprarle comida o juguetes, o directamente a interactuar con la mascota. Si no tiene Huevos de Plata para la tienda, dile que gane más jugando en la Zona de Juegos.
- Utiliza la enorme lista de referencias del catálogo para sugerir.
- Ofrece las otras actividades (Pintar, Juegos, Mascota, Tienda) como opciones complementarias si el niño lo pide.

Interacción Proactiva:
- Mantén un lenguaje simple, empático, entusiasta y divertido.
- Usa los metadatos de los videos para fomentar la reflexión y el aprendizaje tras la visualización.
- Si el niño cambia de idioma, actualiza tus respuestas inmediatamente a ese idioma.

📚 TUS HISTORIAS MÁGICAS (REFERENCIA DE VIDEOS)
Tienes un catálogo inmenso de videos. Aquí tienes algunos que puedes recomendar ahora mismo (NO LEAS LA LISTA, elige uno y sugiérelo naturalmente integrándolo en tu charla):
${videosInfo}

⚙️ COMANDOS MÁGICOS DE EJECUCIÓN (INCLUYE AL FINAL DE TU RESPUESTA)
Si el niño acepta realizar una actividad, incluye el comando correspondiente AL FINAL de tu frase:
- Ver un video (ejemplo con Panda): ||CMD:PLAY_VIDEO:panda|| (reemplaza 'panda' por la palabra clave del video elegido)
- Jugar Globos Locos: ||CMD:OPEN_BALLOONS||
- Jugar Atrapa al Topo: ||CMD:OPEN_MOLES||
- Jugar Arma la Cara: ||CMD:OPEN_FACE||
- Jugar Piano Mágico: ||CMD:OPEN_PIANO||
- Pintar o Dibujar: ||CMD:OPEN_PAINT||
- Ver a la Mascota/Huevo: ||CMD:OPEN_PET||
- Ir a la Tienda Mágica: ||CMD:OPEN_STORE||

REGLA CRÍTICA UNIVERSAL: ¡Debes generar TODA tu respuesta EXCLUSIVAMENTE en el idioma correspondiente a este código: ${typeof userData !== 'undefined' ? userData.idioma : 'es'}!
}

/**
 * Inicializa el Tutor IA con el perfil del niño cargado desde Supabase
 */
function initAITutor(childProfile) {
    currentChildProfile = childProfile;
    window.aiPendingAction = null; 

    const systemPrompt = getSystemPrompt();

    // Persistencia: Cargar memoria de la sesión anterior o inicializar nueva
    const savedHistory = localStorage.getItem('kuboki_ai_history');
    if (savedHistory) {
        try {
            conversationHistory = JSON.parse(savedHistory);
            // Actualizamos la memoria base por si acaso cambió el nivel o el nombre
            if (conversationHistory.length > 0 && conversationHistory[0].role === "system") {
                conversationHistory[0].content = systemPrompt;
            } else {
                conversationHistory.unshift({ role: "system", content: systemPrompt });
            }
        } catch (e) {
            conversationHistory = [{ role: "system", content: systemPrompt }];
        }
    } else {
        conversationHistory = [{ role: "system", content: systemPrompt }];
    }

    childStatus.innerText = "El bosque te escucha...";

    // Configurar el micrófono frontend
    if (!('webkitSpeechRecognition' in window)) {
        console.error("Este navegador no soporta Web Speech API. Usa Chrome.");
        childStatus.innerText = "Micrófono no compatible";
        return;
    }

    // En lugar de texto duro en español, le pedimos a Groq que genere el saludo inicial dinámicamente
    setTimeout(() => {
        let promptInicial = "";
        
        let stateContext = "";
        if (window.StorageManager) {
            const state = window.StorageManager.getState();
            stateContext = `Estado de la Mascota: Hambre al ${state.mascota_estado.hambre}% y Felicidad al ${state.mascota_estado.felicidad}%. Huevos de Plata ahorrados: ${state.saldo_huevos}.`;
        }
        
        if (conversationHistory.length > 1) {
            promptInicial = `[System Message: El niño (Nombre: ${userData.nombre}) ha regresado a la app. Salúdalo de forma amigable siguiendo ESTRICTAMENTE esta estructura: 
1. Saludo en su idioma local.
2. Di su nombre (${userData.nombre}).
3. Menciona algo sobre su mascota basándote en este contexto: ${stateContext} (Ej: "Tu panda tiene un poco de hambre" o "¡Tienes muchos huevos guardados!").
4. Sugerencia proactiva: Invítalo a ganar más huevos en la Zona de Juegos, a ir a la Tienda Mágica, a abrir el Cine Kuboki o a escuchar la Radio Mágica.
CRITICAL RULE 1: YOU MUST SPEAK EXCLUSIVELY IN THE LANGUAGE CODE: ${userData.idioma}. CRITICAL RULE 2: DO NOT USE ANY ||CMD|| COMMANDS YET!]`;
        } else {
            promptInicial = `[System Message: Es la primera vez que el niño entra hoy. Salúdalo muy brevemente (max 20 palabras). Estructura: 
1. Saludo.
2. Su nombre (${userData.nombre}).
3. Invítalo a jugar, ver historias en el Cine Kuboki o escuchar la Radio Mágica.
CRITICAL RULE 1: YOU MUST SPEAK EXCLUSIVELY IN THE LANGUAGE CODE: ${userData.idioma}. CRITICAL RULE 2: ABSOLUTELY DO NOT USE ANY ||CMD|| COMMANDS NOW.]`;
        }

        // Llamamos a Groq directamente sin que el niño haya dicho nada
        askGroq(promptInicial);
    }, 1000);
}

/**
 * Activar micrófono y escuchar (Conversación Continua)
 */
function startListening() {
    if (aiSpeaking) return; // No escuchar nuestra propia voz
    // Eliminado el bloqueo isViewingMedia: el árbol escuchará siempre, incluso viendo videos (Los navegadores modernos cancelan el eco).

    if (!recognition) {
        if (!('webkitSpeechRecognition' in window)) {
            console.error("Este navegador no soporta Web Speech API.");
            return;
        }

        recognition = new webkitSpeechRecognition();
        recognition.lang = (currentChildProfile ? currentChildProfile.idioma : null) || (typeof userData !== 'undefined' ? userData.idioma : 'es-ES');
        recognition.interimResults = false; // Solo procesa la frase entera cuando hace pausa
        recognition.maxAlternatives = 1;

        recognition.onstart = function () {
            isListening = true;
            if (listeningIndicator) listeningIndicator.style.display = 'block';
            if (childStatus) childStatus.innerText = getT('l');
            if (window.setTreeExpression) window.setTreeExpression('LISTENING');
        };

        recognition.onresult = async function (event) {
            const transcript = event.results[0][0].transcript.trim();
            if (!transcript) return;

            console.log("Niño dijo: ", transcript);
            if (childStatus) childStatus.innerText = getT('p');
            
            // Pausar escucha mientras piensa y responde para evitar captarse a sí mismo
            isListening = false;
            aiSpeaking = true; // FIX: Prevenir que .onend reanude el mic prematuramente antes del await de Groq
            recognition.stop(); 
            
            await askGroq(transcript);
        };

        recognition.onerror = function (event) {
            console.error("Error de voz: ", event.error);
            isListening = false;
            if (listeningIndicator) listeningIndicator.style.display = 'none';
            
            // Si nadie habla por un rato, web speech lanza 'no-speech'. Reiniciamos en silencio.
            if (event.error === 'no-speech' && !aiSpeaking) {
                setTimeout(() => { if (!aiSpeaking && !isListening) startListening(); }, 500);
            } else if (event.error !== 'aborted') {
                if (childStatus) childStatus.innerText = getT('ps');
            }
        };

        recognition.onend = function () {
            isListening = false;
            if (listeningIndicator) listeningIndicator.style.display = 'none';
            if (!aiSpeaking && window.setTreeExpression) window.setTreeExpression('IDLE');
            // Auto-reinicio continuo para modo "Walkie-Talkie Hands Free", excepto si el IA tomó la palabra
            if (!aiSpeaking) {
                setTimeout(() => { if (!aiSpeaking && !isListening) startListening(); }, 300);
            }
        };
    }

    try {
        if (!isListening) recognition.start();
    } catch (e) {
        // Evitar crashear si ya estaba arrancado
    }
}

/**
 * Consulta a Groq API para latencia < 1.5s
 */
async function askGroq(userText) {
    conversationHistory.push({ role: "user", content: userText });

    try {
        let response;
        let retries = 2;
        
        // Sanear el historial por si el localStorage guardó algo corrupto
        const safeMessages = conversationHistory.filter(m => m && m.role && typeof m.content === 'string');
        
        // Ciclo de persistencia de red (reintentos)
        while (retries >= 0) {
            try {
                response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "llama-3.1-8b-instant", // Modelo actualizado (Groq deprecó el anterior)
                        messages: safeMessages,
                        temperature: 0.7,
                        max_tokens: 150
                    })
                });
                
                if (response.ok) break; // Si hay conexión, salimos del ciclo de reintentos
                if (response.status === 429) await new Promise(r => setTimeout(r, 2000)); // Rate limit backoff
            } catch (err) {
                if (retries === 0) throw err; // Si ya no hay reintentos, lanzamos error
            }
            retries--;
            if (retries >= 0) console.warn("Reintentando conexión con Groq API...");
        }

        const data = await response.json();

        if (data.error) {
            console.error("Groq API Error:", data.error);
            const errMsg = data.error.message || JSON.stringify(data.error);
            if (childStatus) childStatus.innerText = getT('api_err') + errMsg;
            alert(getT('api_err') + errMsg);
            conversationHistory.pop(); // Revertimos el mensaje del usuario si falló
            aiSpeaking = false; // FIX DEADLOCK
            setTimeout(startListening, 1000);
            return;
        }

        let aiText = data.choices[0].message.content;

        // LANGUAGE GUARD: Validación de fuga de contexto
        if (window.LanguageGuard) {
            const isSafe = await window.LanguageGuard.safeWrapAIOutput(aiText, null);
            if (!isSafe) {
                // Si la validación falla (ej. Groq habla en español estando en alemán),
                // removemos el prompt fallido, re-disparamos askGroq en modo estricto y abortamos esta ejecución.
                conversationHistory.pop(); 
                conversationHistory.push({ role: "system", content: "CRITICAL SYSTEM OVERRIDE: YOU MUST SPEAK EXCLUSIVELY IN THE SELECTED LANGUAGE CODE AND NOTHING ELSE." });
                await askGroq(userText);
                return;
            }
        }

        // EJECUTOR DE COMANDOS DEL SISTEMA ULTRA SEGURO
        if (aiText.includes("||CMD:") || aiText.includes("||cmd:")) {
            const cmdMatch = aiText.match(/\|\|CMD:\s*([^|]+)\|\|/i);
            if (cmdMatch) {
                window.aiPendingAction = cmdMatch[1].trim().toUpperCase();
                aiText = aiText.replace(cmdMatch[0], "").trim();

                // BYPASS DE LATENCIA: Si es una orden de video, ejecutamos al instante cortando la charla lenta de la IA
                if (window.aiPendingAction.includes('PLAY') || window.aiPendingAction.includes('STOP')) {
                    console.log("BYPASS 0-LATENCY: Acción de video detectada. Ejecutando inmediatamente.");
                    if (window.executeAIAction) {
                        window.executeAIAction(window.aiPendingAction);
                        window.aiPendingAction = null;
                        
                        // Forzar a la IA a decir una frase mínima y rápida en lugar de la parrafada generada
                        aiText = "¡Magia!"; 
                    }
                }
            }
        }

        conversationHistory.push({ role: "assistant", content: aiText });

        // Limitar buffer a 10-15 mensajes para ahorrar tokens y mantener cordura del modelo
        if (conversationHistory.length > 15) {
            conversationHistory.splice(1, 2);
        }

        // GUARDAR MEMORIA EN LOCALSTORAGE (Persistencia principal)
        localStorage.setItem('kuboki_ai_history', JSON.stringify(conversationHistory));

        // Poner bandera de AI hablando antes de sintetizar
        aiSpeaking = true;
        // Sintetizar voz en paralelo
        await speakText(aiText);

    } catch (e) {
        console.error(e);
        if (childStatus) childStatus.innerText = getT('net_err') + e.message;
        alert(getT('net_err') + e.message);
        aiSpeaking = false; // FIX DEADLOCK
        setTimeout(startListening, 1500);
    }
}

window.setTreeExpression = function(state) {
    const video = document.getElementById('tree-video-avatar');
    const fallback = document.getElementById('tree-fallback-img');
    if (!video) return;

    let src = '';
    switch(state) {
        case 'IDLE': src = 'public/assets/videos/arbol/idle.mp4'; break;
        case 'TALKING': src = 'public/assets/videos/arbol/talking.mp4'; break;
        case 'LISTENING': src = 'public/assets/videos/arbol/listening.mp4'; break;
        case 'HAPPY': src = 'public/assets/videos/arbol/happy.mp4'; break;
        default: src = 'public/assets/videos/arbol/idle.mp4';
    }

    // Si ya estamos reproduciendo ese mismo archivo, no reiniciar
    if (!video.src.endsWith(src)) {
        video.src = src;
        video.play().catch(e => {
            console.warn("[TreeAvatar] Falló carga de video, usando fallback.", e);
            video.style.display = 'none';
            if(fallback) fallback.style.display = 'block';
        });
        
        // Si el video carga bien, quitar el fallback
        video.onloadeddata = () => {
            video.style.display = 'block';
            if(fallback) fallback.style.display = 'none';
        };
        
        // Manejo de Errores: Fallback seguro
        video.onerror = () => {
            video.style.display = 'none';
            if(fallback) fallback.style.display = 'block';
        };
    }
};

/**
 * Convierte el texto de Groq en Audio Ultra-Realista usando OpenAI TTS
 */
async function speakText(text) {
    if (childStatus) childStatus.innerText = getT('h');
    aiSpeaking = true;
    
    // Aura mágica del árbol al hablar y animación de cara
    const tree = document.getElementById('tree-avatar-container');
    if (tree) {
        tree.style.boxShadow = '0 0 50px #ff00ff'; // Brillo rosa intenso
        tree.style.animation = 'pulse-logo 1.5s infinite';
    }

    if (window.setTreeExpression) {
        window.setTreeExpression('TALKING');
    }
    
    // Retrocompatibilidad con la cara vieja
    let talkInterval;
    if (window.drawExpression) {
        talkInterval = setInterval(() => {
            const exp = Math.random() > 0.5 ? 'LAUGHING' : 'HAPPY';
            window.drawExpression(exp, '#ff00ff');
        }, 250);
    }
    
    // Detener mic temporalmente por seguridad para no escucharse a sí mismo
    if (recognition && isListening) recognition.stop();

    const bgm = document.getElementById('bg-music');
    if (bgm) bgm.volume = 0.00; // Mutea la música por completo para que la IA se escuche nítida y rotunda

    try {
        // --- NATIVE TTS (WEB SPEECH API) 100% GRATUITO ---
        if (childStatus) childStatus.innerText = getT('h'); 
        
        window.speechSynthesis.cancel(); // Detener audios previos
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = userData.idioma || 'es-ES';
        
        // Intentar buscar explícitamente voces masculinas u oscuras
        const voces = window.speechSynthesis.getVoices();
        const vocesIdioma = voces.filter(v => v.lang.startsWith(utterance.lang.split('-')[0]));
        const nombresMasculinos = ['Pablo', 'Raul', 'Daniel', 'Jorge', 'Juan', 'Carlos', 'Pedro', 'Male', 'Masculino'];
        
        let mejorVoz = vocesIdioma.find(v => nombresMasculinos.some(n => v.name.includes(n)));
        
        if (!mejorVoz) {
            // Si nos toca una voz obligatoriamente femenina, oscurecemos el pitch muchísimo para simular abuelo
            mejorVoz = vocesIdioma.find(v => v.name.includes("Premium") || v.name.includes("Enhanced") || v.name.includes("Google") || v.name.includes("Natural"));
            utterance.pitch = 0.4;
            utterance.rate = 0.9;
        } else {
            // Si encontramos un hombre, lo hacemos sonar un poco lento y sabio
            utterance.pitch = 0.8;
            utterance.rate = 0.9;
        }

        if (!mejorVoz && vocesIdioma.length > 0) mejorVoz = vocesIdioma[0];
        if (mejorVoz) utterance.voice = mejorVoz;

        utterance.onend = () => {
            if (childStatus) childStatus.innerText = getT('c'); 
            if (bgm) bgm.volume = 0.01; 
            if (tree) { tree.style.boxShadow = '0 0 30px var(--primary-color)'; tree.style.animation = 'none'; }
            if (talkInterval) {
                clearInterval(talkInterval);
                if (window.drawExpression) window.drawExpression('NEUTRAL', '#00FFFF');
            }
            if (window.setTreeExpression) window.setTreeExpression('IDLE');
            aiSpeaking = false;
            
            if (window.aiPendingAction && window.executeAIAction) {
                const completado = window.executeAIAction(window.aiPendingAction);
                window.aiPendingAction = null;
                if (!completado) startListening();
            } else {
                startListening(); 
            }
        };

        utterance.onerror = (e) => {
            console.error("Error TTS nativo:", e);
            if (childStatus) childStatus.innerText = getT('ea');
            if (bgm) bgm.volume = 0.01;
            if (tree) { tree.style.boxShadow = '0 0 30px var(--primary-color)'; tree.style.animation = 'none'; }
            aiSpeaking = false;
            startListening();
        };

        // Bugfix Chrome: Asegurar que no sea recolectado por el Garbage Collector
        window.utteranceFallback = utterance;
        window.speechSynthesis.speak(utterance);

    } catch (e) {
        console.error("Error catastrofico de audio:", e);
        if (childStatus) childStatus.innerText = getT('ea');
        if (tree) { tree.style.boxShadow = '0 0 30px var(--primary-color)'; tree.style.animation = 'none'; }
        aiSpeaking = false;
        startListening();
    }
}

// Bindeo de eventos
if (btnTalkAI) {
    btnTalkAI.addEventListener('click', startListening);
}

// Exportar globalmente
window.initAITutor = initAITutor;
window.askGroq = askGroq;
window.speakText = speakText;

/**
 * Traducci�n din�mica del texto legal COPPA (Cero Peso para el frontend)
 */
window.translateLegalText = async function(targetLang, legalTextES) {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': \Bearer \\,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{
                    role: 'system',
                    content: \You are a certified legal translator. Translate the following COPPA Privacy Policy strictly into the language code: \. Do NOT add any conversational text, greetings, or explanations. Just output the translated legal text exactly as formatted in markdown.\
                }, {
                    role: 'user',
                    content: legalTextES
                }],
                temperature: 0.1,
                max_tokens: 1000
            })
        });
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        }
        throw new Error('Translation failed');
    } catch(e) {
        console.error('Error translating legal text:', e);
        return null;
    }
};

