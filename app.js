// --- 1. CONFIGURACIÃ“N ---
const supabaseUrl = 'https://opkdnknhdrhnugatgesb.supabase.co';
const supabaseKey = 'sb_publishable_kKFkXY_aAZ59EV8Cj8n4bg_fVvIMFj1';
const { createClient } = supabase;
const _supabase = createClient(supabaseUrl, supabaseKey);

let userData = { nombre: '', edad: null, bandera: '', idioma: 'es-ES', personaje: '' };
let musicaActiva = false;

// FunciÃ³n global para sincronizar el progreso instantÃ¡neamente
async function syncProgress() {
    // 1. Guardar localmente
    localStorage.setItem('kuboki_user', JSON.stringify(userData));
    // 2. Guardar en la nube (Supabase) si el usuario ya estÃ¡ registrado
    if (window._supabase && userData.nombre) {
        try {
            await _supabase.from('usuarios_kuboki').update({
                huevos_plata: userData.huevos_plata || 0,
                huevos_oro: userData.huevos_oro || 0,
                mascota_activa: userData.mascota_activa || null
            }).eq('nombre', userData.nombre);
        } catch (e) {
            console.warn("SincronizaciÃ³n en segundo plano fallÃ³:", e);
        }
    }
}

// ===============================================
// SISTEMA DINÃMICO DE VIDEOS (NUEVA ARQUITECTURA)
// ===============================================
window.KUBOKI_VIDEO_DB_REAL = [];
window.LAST_WATCHED_VIDEO = null; // Guarda el video actual para la reacciÃ³n post-visualizaciÃ³n

// Mapeo de idiomas a IDs de canales de prueba (Reemplazar con canales reales cuando existan)
const CHANNEL_MAP = {
    'en': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal InglÃ©s
    'es': 'UCHxjbOFLYWJxIPqc3s4er5w', // Canal EspaÃ±ol
    'pt': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal PortuguÃ©s
    'fr': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal FrancÃ©s
    'it': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal Italiano
    'de': 'UCHxjbOFLYWJxIPqc3s4er5w', // Canal AlemÃ¡n
    'hu': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal HÃºngaro
    'pl': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal Polaco
    'no': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal Noruego
    'sv': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal Sueco
    'ro': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal Rumano
    'nl': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal HolandÃ©s
    'da': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal DanÃ©s
    'tr': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal Turco
    'ar': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal Ãrabe
    'he': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal Hebreo
    'ja': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal JaponÃ©s
    'ko': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal Coreano
    'hi': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal Hindi
    'vi': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal Vietnamita
    'zh': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal Chino
    'th': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal TailandÃ©s
    'tl': 'UCHxjbOFLYWJxIPqc3s4er5w', // TODO: Reemplazar con ID Canal Tagalo
    'default': 'UCHxjbOFLYWJxIPqc3s4er5w'
};

async function loadVideoDatabase() {
    const langCode = typeof userData !== 'undefined' && userData.idioma ? userData.idioma.split('-')[0] : 'es';
    const targetChannel = CHANNEL_MAP[langCode] || CHANNEL_MAP['default'];
    
    // LANGUAGE GUARD INITIALIZATION: Asignamos el contexto maestro
    if (window.LanguageGuard) {
        window.LanguageGuard.setContext(langCode, targetChannel);
    }

    try {
        console.log(`[Supabase Real-Time] Conectando a la nube para canal maestro: ${targetChannel}...`);
        // CONSULTA A SUPABASE EN TIEMPO REAL: Reemplaza al JSON exportado
        const { data, error } = await _supabase
            .from('videos')
            .select('*')
            .eq('channel_id', targetChannel);

        if (error) {
            throw error;
        }

        if (data && data.length > 0) {
            window.KUBOKI_VIDEO_DB_REAL = data;
            console.log(`[Kuboki Engine] Descargados en tiempo real ${window.KUBOKI_VIDEO_DB_REAL.length} videos seguros de la nube.`);
        } else {
            console.warn(`[Supabase] No se encontraron videos para el canal ${targetChannel}.`);
            window.KUBOKI_VIDEO_DB_REAL = [];
        }
    } catch (e) {
        console.error("[Kuboki Engine] Error crÃ­tico conectando con Supabase. AsegÃºrate de haber ejecutado el scraper en la nube:", e);
        window.KUBOKI_VIDEO_DB_REAL = [];
    }
}
// Cargar la DB apenas inicie
loadVideoDatabase();

// BASE DE DATOS MAESTRA DE VIDEOS KUBOKI (LEGACY - Solo por seguridad)
// Esto le da conciencia a la IA sobre quÃ© videos existen, de quÃ© tratan (en espaÃ±ol) y quÃ© enlace YouTube usar en cada idioma.
window.KUBOKI_VIDEO_DB = {
    'pandabamboo': {
        es_description: "El Panda estÃ¡ atado a un Ã¡rbol, los trols lo ataron y le robaron el huevo mÃ¡gico. De casualidad caen 10 huevos al lado del Panda y nacen animalitos bebÃ© (cocodrilo, pato, etc.). El Ãºltimo en nacer es un dragÃ³n bebÃ© rojo que lanza fuego, quema las sogas y libera al Panda feliz.",
        links: {
            'es': 'JOkaDb46qDs', // Placeholder genÃ©rico hasta tener el espaÃ±ol real
            'de': 'MkvcCrAYQqQ', // Episodio 29 AlemÃ¡n
            'ko': 'MkvcCrAYQqQ', // Episodio 29 Corea
            'default': 'JOkaDb46qDs'
        }
    },
    'foxwind': {
        es_description: "El Zorro ayuda al Panda a buscar los huevos perdidos en el bosque mÃ¡gico. Juntos enfrentan acertijos divertidos para recuperar el tesoro robado por los trols.",
        links: {
            'es': 'JOkaDb46qDs', 
            'de': 'MkvcCrAYQqQ', // Usando Ep 29 como demo
            'ko': 'MkvcCrAYQqQ',
            'default': 'JOkaDb46qDs'
        }
    },
    'dinowater': {
        es_description: "El Panda cae accidentalmente por un larguÃ­simo tobogÃ¡n de agua natural en la montaÃ±a. Los pequeÃ±os animalitos bebÃ©, como el pequeÃ±o dinosaurio, se lanzan detrÃ¡s de Ã©l, cayendo por las ondulaciones del tobogÃ¡n con mucha diversiÃ³n y risas hasta llegar a un lago mÃ¡gico.",
        links: {
            'es': 'g0z_msbqShg', // Placeholder genÃ©rico
            'de': 'g0z_msbqShg', // Episodio 31 AlemÃ¡n
            'ko': 'g0z_msbqShg', // Episodio 31 Corea
            'default': 'g0z_msbqShg'
        }
    },
    'leofire': {
        es_description: "El LeÃ³n valiente organiza una carrera por el tobogÃ¡n de agua. Todos los animalitos se divierten saltando y jugando en la gran piscina final.",
        links: {
            'es': 'g0z_msbqShg',
            'de': 'g0z_msbqShg', // Usando Ep 31 como demo
            'ko': 'g0z_msbqShg',
            'default': 'g0z_msbqShg'
        }
    }
};

// Funciones de Rescate de SesiÃ³n (Escapar del bloqueo de idioma)
window.resetSession = function() {
    localStorage.removeItem('kuboki_user');
    localStorage.removeItem('kuboki_ai_history');
    if (window.recognition) { try { window.recognition.stop(); } catch(e){} }
    window.location.href = window.location.pathname + '?reset=1';
};

// --- 2. MOTOR DE AUDIO Y MÃšSICA (REFORZADO) ---
document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
        document.querySelectorAll('audio, video').forEach(m => m.pause());
    } else {
        const bgm = document.getElementById('bg-music');
        if (bgm && musicaActiva) bgm.play().catch(e=>{});
    }
});

function sonarEfecto(tipo) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        if (tipo === 'brillo') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        }
    } catch (e) { }
}

function iniciarMusicaAmbiente() {
    if (musicaActiva) return;
    musicaActiva = true;
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic) {
        bgMusic.volume = 0.01; // Volumen CASI imperceptible para no estorbar a la Inteligencia Artificial
        bgMusic.play().catch(e => console.warn('Audio play failed:', e));
    }
}

// --- 3. MOTOR DE VOZ ---
function decir(texto) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    const voces = window.speechSynthesis.getVoices();
    const vozEncontrada = voces.find(v => v.lang.startsWith(userData.idioma.split('-')[0]));
    if (vozEncontrada) utterance.voice = vozEncontrada;
    utterance.lang = userData.idioma;
    utterance.pitch = 0.9; // Tono mÃ¡s grave de abuelo sabio, ya no es voz de ardilla (2.0)
    utterance.rate = 1.0;

    const bubble = document.getElementById('speech-bubble');
    if (bubble) {
        bubble.textContent = texto;
        bubble.style.display = 'block';
        setTimeout(() => { if (bubble.textContent === texto) bubble.style.display = 'none'; }, 4000);
    }
    window.speechSynthesis.speak(utterance);
}

// --- 4. TRADUCTOR INTEGRAL (LOS 24 IDIOMAS) ---
function traducirInterfaz(lang) {
    const dic = {
        'en': { n: "Your Name:", p: "Type here...", b: "LET'S PLAY!", e: "How old are you?", f: "Choose your flag:", g: "Hello! I'm your friend Kuboki", m: "CLICK THE MICROPHONE TO TALK TO KUBOKI!", mr: "MICROPHONE READY!", gL: "Are you a Boy or a Girl?", gB: "ðŸ‘¦ Boy", gG: "ðŸ‘§ Girl", pwaBtnMsg: "Download App (Quick Access)", pwaTitle: "Take Kuboki with you!", pwaGotIt: "Got it!" },
        'es': { n: "Tu Nombre:", p: "Escribe aquÃ­...", b: "Â¡A JUGAR!", e: "Â¿CuÃ¡ntos aÃ±os tienes?", f: "Elige tu bandera:", g: "Â¡Hola! Soy tu amigo Kuboki", m: "Â¡HAZ CLIC EN EL MICRÃ“FONO PARA HABLAR CON KUBOKI!", mr: "Â¡MICRÃ“FONO LISTO!", gL: "Â¿Eres NiÃ±o o NiÃ±a?", gB: "ðŸ‘¦ NiÃ±o", gG: "ðŸ‘§ NiÃ±a", pwaBtnMsg: "Descargar Ãcono (Acceso Directo)", pwaTitle: "Â¡Lleva a Kuboki contigo!", pwaGotIt: "Â¡Entendido!" },
        'pt': { n: "Seu Nome:", p: "Escreva aqui...", b: "VAMOS JOGAR!", e: "Quantos anos vocÃª tem?", f: "Escolha sua bandeira:", g: "OlÃ¡! Sou seu amigo Kuboki", m: "CLIQUE NO MICROFONE PARA FALAR COM KUBOKI!", mr: "MICROFONE PRONTO!", gL: "VocÃª Ã© Menino ou Menina?", gB: "ðŸ‘¦ Menino", gG: "ðŸ‘§ Menina", pwaBtnMsg: "Baixar Ãcone (Acesso Direto)", pwaTitle: "Leve o Kuboki com vocÃª!", pwaGotIt: "Entendi!" },
        'fr': { n: "Votre Nom:", p: "Ã‰crivez ici...", b: "JOUONS!", e: "Quel Ã¢ge as-tu?", f: "Choisissez votre drapeau:", g: "Bonjour ! Je suis ton ami Kuboki", m: "CLIQUE SUR LE MICRO POUR PARLER Ã€ KUBOKI!", mr: "MICRO PRÃŠT!", gL: "Es-tu un GarÃ§on ou une Fille ?", gB: "ðŸ‘¦ GarÃ§on", gG: "ðŸ‘§ Fille", pwaBtnMsg: "TÃ©lÃ©charger l'icÃ´ne (AccÃ¨s direct)", pwaTitle: "Emportez Kuboki avec vous !", pwaGotIt: "Compris !" },
        'it': { n: "Il Tuo Nome:", p: "Scrivi qui...", b: "GIOCHIAMO!", e: "Quanti anni hai?", f: "Scegli la tua bandiera:", g: "Ciao! Sono il tuo amico Kuboki", m: "CLICCA SUL MICROFONO PER PARLARE CON KUBOKI!", mr: "MICROFONO PRONTO!", gL: "Sei un Bambino o una Bambina?", gB: "ðŸ‘¦ Bambino", gG: "ðŸ‘§ Bambina", pwaBtnMsg: "Scarica l'icona (Accesso diretto)", pwaTitle: "Porta Kuboki con te!", pwaGotIt: "Capito!" },
        'de': { n: "Dein Name:", p: "Hier schreiben...", b: "SPIELEN!", e: "Wie alt bist du?", f: "WÃ¤hle deine Flagge:", g: "Hallo! Ich bin dein Freund Kuboki", m: "KLICKE AUF DAS MIKROFON, UM MIT KUBOKI ZU SPRECHEN!", mr: "MIKROFON BEREIT!", gL: "Bist du ein Junge oder ein MÃ¤dchen?", gB: "ðŸ‘¦ Junge", gG: "ðŸ‘§ MÃ¤dchen", pwaBtnMsg: "Symbol herunterladen (Direktzugriff)", pwaTitle: "Nimm Kuboki mit!", pwaGotIt: "Verstanden!" },
        'hu': { n: "A neved:", p: "Ãrj ide...", b: "JÃTSSZUNK!", e: "HÃ¡ny Ã©ves vagy?", f: "VÃ¡laszd ki a zÃ¡szlÃ³t:", g: "Szia! Ã‰n vagyok a barÃ¡tod, Kuboki", m: "KATTINTS A MIKROFONRA, HOGY BESZÃ‰LJ KUBOKIKAL!", mr: "MIKROFON KÃ‰SZ!", gL: "FiÃº vagy LÃ¡ny vagy?", gB: "ðŸ‘¦ FiÃº", gG: "ðŸ‘§ LÃ¡ny", pwaBtnMsg: "Ikon letÃ¶ltÃ©se (KÃ¶zvetlen hozzÃ¡fÃ©rÃ©s)", pwaTitle: "Vidd magaddal Kubokit!", pwaGotIt: "Ã‰rtettem!" },
        'pl': { n: "Twoje imiÄ™:", p: "Wpisz tutaj...", b: "ZAGRAJMY!", e: "Ile masz lat?", f: "Wybierz flagÄ™:", g: "CzeÅ›Ä‡! Jestem twoim przyjacielem Kuboki", m: "KLIKNIJ MIKROFON, ABY POROZMAWIAÄ† Z KUBOKI!", mr: "MIKROFON GOTOWY!", gL: "JesteÅ› ChÅ‚opcem czy DziewczynkÄ…?", gB: "ðŸ‘¦ ChÅ‚opiec", gG: "ðŸ‘§ Dziewczynka", pwaBtnMsg: "Pobierz ikonÄ™ (Szybki dostÄ™p)", pwaTitle: "Zabierz Kuboki ze sobÄ…!", pwaGotIt: "ZrozumiaÅ‚em!" },
        'no': { n: "Ditt navn:", p: "Skriv her...", b: "LA OSS SPILLE!", e: "Hvor gammel er du?", f: "Velg flagg:", g: "Hei! Jeg er din venn Kuboki", m: "KLIKK PÃ… MIKROFONEN FOR Ã… SNAKKE MED KUBOKI!", mr: "MIKROFON KLAR!", gL: "Er du en Gutt eller en Jente?", gB: "ðŸ‘¦ Gutt", gG: "ðŸ‘§ Jente", pwaBtnMsg: "Last ned ikon (Direkte tilgang)", pwaTitle: "Ta med deg Kuboki!", pwaGotIt: "SkjÃ¸nner!" },
        'sv': { n: "Ditt namn:", p: "Skriv hÃ¤r...", b: "LÃ…T OSS SPELA!", e: "Hur gammal Ã¤r du?", f: "VÃ¤lj flagga:", g: "Hej! Jag Ã¤r din vÃ¤n Kuboki", m: "KLICKA PÃ… MIKROFONEN FÃ–R ATT PRATA MED KUBOKI!", mr: "MIKROFON KLAR!", gL: "Ã„r du en Pojke eller en Flicka?", gB: "ðŸ‘¦ Pojke", gG: "ðŸ‘§ Flicka", pwaBtnMsg: "Ladda ner ikon (DirektÃ¥tkomst)", pwaTitle: "Ta med dig Kuboki!", pwaGotIt: "FÃ¶rstÃ¥tt!" },
        'ro': { n: "Numele tÄƒu:", p: "Scrie aici...", b: "SÄ‚ NE JUCÄ‚M!", e: "CÃ¢È›i ani ai?", f: "Alege steagul:", g: "Salut! Sunt prietenul tÄƒu Kuboki", m: "FÄ‚ CLIC PE MICROFON PENTRU A VORBI CU KUBOKI!", mr: "MICROFON PREGÄ‚TIT!", gL: "EÈ™ti BÄƒiat sau FatÄƒ?", gB: "ðŸ‘¦ BÄƒiat", gG: "ðŸ‘§ FatÄƒ", pwaBtnMsg: "DescarcÄƒ pictograma (Acces direct)", pwaTitle: "Ia Kuboki cu tine!", pwaGotIt: "Am Ã®nÈ›eles!" },
        'nl': { n: "Je naam:", p: "Schrijf hier...", b: "LATEN WE SPELEN!", e: "Hoe oud ben je?", f: "Kies je vlag:", g: "Hallo! Ik ben je vriend Kuboki", m: "KLIK OP DE MICROFOON OM MET KUBOKI TE PRATEN!", mr: "MICROFOON KLAAR!", gL: "Ben je een Jongen of een Meisje?", gB: "ðŸ‘¦ Jongen", gG: "ðŸ‘§ Meisje", pwaBtnMsg: "Download icoon (Directe toegang)", pwaTitle: "Neem Kuboki met je mee!", pwaGotIt: "Begrepen!" },
        'da': { n: "Dit navn:", p: "Skriv her...", b: "LAD OS SPILLE!", e: "Hvor gammel er du?", f: "VÃ¦lg dit flag:", g: "Hej! Jeg er din ven Kuboki", m: "KLIK PÃ… MIKROFONEN FOR AT TALE MED KUBOKI!", mr: "MIKROFON KLAR!", gL: "Er du en Dreng eller en Pige?", gB: "ðŸ‘¦ Dreng", gG: "ðŸ‘§ Pige", pwaBtnMsg: "Download ikon (Direkte adgang)", pwaTitle: "Tag Kuboki med dig!", pwaGotIt: "ForstÃ¥et!" },
        'tr': { n: "AdÄ±nÄ±z:", p: "Buraya yazÄ±n...", b: "OYNAYALIM!", e: "KaÃ§ yaÅŸÄ±ndasÄ±n?", f: "BayraÄŸÄ±nÄ± seÃ§:", g: "Merhaba! Ben arkadaÅŸÄ±n Kuboki'Ä±m", m: "KUBOKI Ä°LE KONUÅžMAK Ä°Ã‡Ä°N MÄ°KROFONA TIKLAYIN!", mr: "MÄ°KROFON HAZIR!", gL: "KÄ±z mÄ±sÄ±n Erkek misin?", gB: "ðŸ‘¦ Erkek", gG: "ðŸ‘§ KÄ±z", pwaBtnMsg: "Simgeyi Ä°ndir (DoÄŸrudan EriÅŸim)", pwaTitle: "Kuboki'yi yanÄ±na al!", pwaGotIt: "AnladÄ±m!" },
        'ar': { n: "Ø§Ø³Ù…Ùƒ:", p: "Ø§ÙƒØªØ¨ Ù‡Ù†Ø§...", b: "Ù„Ù„Ù†Ø¹Ù„Ø¨!", e: "ÙƒÙ… Ø¹Ù…Ø±ÙƒØŸ", f: "Ø§Ø®ØªØ± Ø¹Ù„Ù…Ùƒ:", g: "Ù…Ø±Ø­Ø¨Ø§Ù‹! Ø£Ù†Ø§ ØµØ¯ÙŠÙ‚Ùƒ ÙŠØ§Ùƒ", m: "Ø§Ù†Ù‚Ø± Ø¹Ù„Ù‰ Ø§Ù„Ù…ÙŠÙƒØ±ÙˆÙÙˆÙ† Ù„Ù„ØªØ­Ø¯Ø« Ù…Ø¹ ÙŠØ§Ùƒ!", mr: "Ø§Ù„Ù…ÙŠÙƒØ±ÙˆÙÙˆÙ† Ø¬Ø§Ù‡Ø²!", gL: "Ù‡Ù„ Ø£Ù†Øª ÙˆÙ„Ø¯ Ø£Ù… Ø¨Ù†ØªØŸ", gB: "ðŸ‘¦ ÙˆÙ„Ø¯", gG: "ðŸ‘§ Ø¨Ù†Øª", pwaBtnMsg: "ØªÙ†Ø²ÙŠÙ„ Ø§Ù„Ø£ÙŠÙ‚ÙˆÙ†Ø© (ÙˆØµÙˆÙ„ Ù…Ø¨Ø§Ø´Ø±)", pwaTitle: "Ø®Ø° ÙƒÙˆØ¨ÙˆÙƒÙŠ Ù…Ø¹Ùƒ!", pwaGotIt: "ÙÙ‡Ù…Øª!" },
        'he': { n: "×”×©× ×©×œ×š:", p: "×›×ª×•×‘ ×›××Ÿ...", b: "×‘×•× × ×©×—×§!", e: "×‘×Ÿ ×›×ž×” ××ª×”?", f: "×‘×—×¨ ×“×’×œ:", g: "×©×œ×•×! ×× ×™ ×—×‘×¨×š ×™××§", m: "×œ×—×¥ ×¢×œ ×”×ž×™×§×¨×•×¤×•×Ÿ ×›×“×™ ×œ×“×‘×¨ ×¢× ×™××§!", mr: "×ž×™×§×¨×•×¤×•×Ÿ ×ž×•×›×Ÿ!", gL: "×”×× ××ª×” ×‘×Ÿ ××• ×‘×ª?", gB: "ðŸ‘¦ ×‘×Ÿ", gG: "ðŸ‘§ ×‘×ª", pwaBtnMsg: "×”×•×¨×“ ×¡×ž×œ (×’×™×©×” ×™×©×™×¨×”)", pwaTitle: "×§×— ××ª ×§×•×‘×•×§×™ ××™×ª×š!", pwaGotIt: "×”×‘× ×ª×™!" },
        'ja': { n: "ãŠåå‰:", p: "å…¥åŠ›ã—ã¦...", b: "éŠã³ã¾ã—ã‚‡ã†ï¼", e: "ä½•æ­³ã§ã™ã‹ï¼Ÿ", f: "å›½æ——ã‚’é¸ã‚“ã§:", g: "ã“ã‚“ã«ã¡ã¯ï¼åƒ•ã¯å›ã®å‹é”ã€ãƒ¤ã‚¯ã ã‚ˆ", m: "ãƒžã‚¤ã‚¯ã‚’ã‚¯ãƒªãƒƒã‚¯ã—ã¦ãƒ¤ã‚¯ã¨è©±ãã†ï¼", mr: "ãƒžã‚¤ã‚¯æº–å‚™å®Œäº†ï¼", gL: "ç”·ã®å­ã§ã™ã‹ï¼Ÿå¥³ã®å­ã§ã™ã‹ï¼Ÿ", gB: "ðŸ‘¦ ç”·ã®å­", gG: "ðŸ‘§ å¥³ã®å­", pwaBtnMsg: "ã‚¢ã‚¤ã‚³ãƒ³ã‚’ãƒ€ã‚¦ãƒ³ãƒ­ãƒ¼ãƒ‰ (ç›´æŽ¥ã‚¢ã‚¯ã‚»ã‚¹)", pwaTitle: "ã‚¯ãƒœã‚­ã‚’é€£ã‚Œã¦è¡Œã“ã†ï¼", pwaGotIt: "ã‚ã‹ã£ãŸï¼" },
        'ko': { n: "ì´ë¦„:", p: "ì—¬ê¸°ì— ìž‘ì„±...", b: "ë†€ìž!", e: "ëª‡ ì‚´ì´ë‹ˆ?", f: "êµ­ê¸°ë¥¼ ì„ íƒí•˜ì„¸ìš”:", g: "ì•ˆë…•! ë‚˜ëŠ” ë„ˆì˜ ì¹œêµ¬ ì•¼í¬ì•¼", m: "ë§ˆì´í¬ë¥¼ í´ë¦­í•˜ì—¬ ì•¼í¬ì™€ ëŒ€í™”í•˜ì„¸ìš”!", mr: "ë§ˆì´í¬ ì¤€ë¹„ ì™„ë£Œ!", gL: "ë„ˆëŠ” ë‚¨ìžì•„ì´ë‹ˆ, ì—¬ìžì•„ì´ë‹ˆ?", gB: "ðŸ‘¦ ë‚¨ìž", gG: "ðŸ‘§ ì—¬ìž", pwaBtnMsg: "ì•„ì´ì½˜ ë‹¤ìš´ë¡œë“œ (ë¹ ë¥¸ ì•¡ì„¸ìŠ¤)", pwaTitle: "ì¿ ë³´í‚¤ë¥¼ ë°ë ¤ê°€ì„¸ìš”!", pwaGotIt: "ì•Œì•˜ì–´ìš”!" },
        'hi': { n: "à¤†à¤ªà¤•à¤¾ à¤¨à¤¾à¤®:", p: "à¤¯à¤¹à¤¾à¤ à¤²à¤¿à¤–à¥‡à¤‚...", b: "à¤šà¤²à¥‹ à¤–à¥‡à¤²à¥‡à¤‚!", e: "à¤†à¤ªà¤•à¥€ à¤‰à¤®à¥à¤° à¤•à¥à¤¯à¤¾ à¤¹à¥ˆ?", f: "à¤…à¤ªà¤¨à¤¾ à¤à¤‚à¤¡à¤¾ à¤šà¥à¤¨à¥‡à¤‚:", g: "à¤¨à¤®à¤¸à¥à¤¤à¥‡! à¤®à¥ˆà¤‚ à¤†à¤ªà¤•à¤¾ à¤¦à¥‹à¤¸à¥à¤¤ à¤¯à¤¾à¤• à¤¹à¥‚à¤", m: "à¤¯à¤¾à¤• à¤¸à¥‡ à¤¬à¤¾à¤¤ à¤•à¤°à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤®à¤¾à¤‡à¤•à¥à¤°à¥‹à¤«à¤¼à¥‹à¤¨ à¤ªà¤° à¤•à¥à¤²à¤¿à¤• à¤•à¤°à¥‡à¤‚!", mr: "à¤®à¤¾à¤‡à¤•à¥à¤°à¥‹à¤«à¤¼à¥‹à¤¨ à¤¤à¥ˆà¤¯à¤¾à¤°!", gL: "à¤•à¥à¤¯à¤¾ à¤†à¤ª à¤à¤• à¤²à¤¡à¤¼à¤•à¤¾ à¤¹à¥ˆà¤‚ à¤¯à¤¾ à¤²à¤¡à¤¼à¤•à¥€?", gB: "ðŸ‘¦ à¤²à¤¡à¤¼à¤•à¤¾", gG: "ðŸ‘§ à¤²à¤¡à¤¼à¤•à¥€", pwaBtnMsg: "à¤†à¤‡à¤•à¤¨ à¤¡à¤¾à¤‰à¤¨à¤²à¥‹à¤¡ à¤•à¤°à¥‡à¤‚ (à¤¸à¥€à¤§à¤¾ à¤à¤•à¥à¤¸à¥‡à¤¸)", pwaTitle: "à¤•à¥à¤¬à¥‹à¤•à¥€ à¤•à¥‹ à¤…à¤ªà¤¨à¥‡ à¤¸à¤¾à¤¥ à¤²à¥‡ à¤œà¤¾à¤“!", pwaGotIt: "à¤¸à¤®à¤ à¤—à¤¯à¤¾!" },
        'vi': { n: "TÃªn cá»§a báº¡n:", p: "Viáº¿t vÃ o Ä‘Ã¢y...", b: "CHÆ I THÃ”I!", e: "Báº¡n bao nhiÃªu tuá»•i?", f: "Chá»n lÃ¡ cá» de báº¡n:", g: "Xin chÃ o! MÃ¬nh lÃ  báº¡n cá»§a báº¡n, Kuboki", m: "Báº¤M VÃ€O MICRO Äá»‚ NÃ“I CHUYá»†N Vá»šI KUBOKI!", mr: "MICRO ÄÃƒ Sáº´N SÃ€NG!", gL: "Báº¡n lÃ  BÃ© Trai hay BÃ© GÃ¡i?", gB: "ðŸ‘¦ BÃ© Trai", gG: "ðŸ‘§ BÃ© GÃ¡i", pwaBtnMsg: "Táº£i biá»ƒu tÆ°á»£ng (Truy cáº­p trá»±c tiáº¿p)", pwaTitle: "Mang Kuboki theo báº¡n!", pwaGotIt: "ÄÃ£ hiá»ƒu!" },
        'zh': { n: "ä½ çš„åå­—:", p: "åœ¨è¿™é‡Œå†™...", b: "è®©æˆ‘ä»¬çŽ©å§ï¼", e: "ä½ å‡ å²äº†ï¼Ÿ", f: "é€‰æ‹©ä½ çš„å›½æ——:", g: "ä½ å¥½ï¼æˆ‘æ˜¯ä½ çš„æœ‹å‹ç‰¦ç‰›Kuboki", m: "ç‚¹å‡»éº¦å…‹é£Žä¸Žç‰¦ç‰›Kubokiäº¤è°ˆï¼", mr: "éº¦å…‹é£Žå·²å‡†å¤‡å¥½ï¼", gL: "ä½ æ˜¯ç”·å­©è¿˜æ˜¯å¥³å­©ï¼Ÿ", gB: "ðŸ‘¦ ç”·å­©", gG: "ðŸ‘§ å¥³å­©", pwaBtnMsg: "ä¸‹è½½å›¾æ ‡ (ç›´æŽ¥è®¿é—®)", pwaTitle: "å¸¦ä¸Šé…·æ³¢åŸºï¼", pwaGotIt: "æ˜Žç™½äº†ï¼" },
        'th': { n: "à¸Šà¸·à¹ˆà¸­à¸‚à¸­à¸‡à¸„à¸¸à¸“:", p: "à¹€à¸‚à¸µà¸¢à¸™à¸—à¸µà¹ˆà¸™à¸µà¹ˆ...", b: "à¸¡à¸²à¹€à¸¥à¹ˆà¸™à¸à¸±à¸™à¹€à¸–à¸­à¸°!", e: "à¸„à¸¸à¸“à¸­à¸²à¸¢à¸¸à¹€à¸—à¹ˆà¸²à¹„à¸£?", f: "à¹€à¸¥à¸·à¸­à¸à¸˜à¸‡à¸‚à¸­à¸‡à¸„à¸¸à¸“:", g: "à¸ªà¸§à¸±à¸ªà¸”à¸µ! à¸‰à¸±à¸™à¸„à¸·à¸­à¹€à¸žà¸·à¹ˆà¸­à¸™à¸‚à¸­à¸‡à¸„à¸¸à¸“ Kuboki", m: "à¸„à¸¥à¸´à¸à¸—à¸µà¹ˆà¹„à¸¡à¹‚à¸„à¸£à¹‚à¸Ÿà¸™à¹€à¸žà¸·à¹ˆà¸­à¸žà¸¹à¸”à¸„à¸¸à¸¢à¸à¸±à¸š Kuboki!", mr: "à¹„à¸¡à¹‚à¸„à¸£à¹‚à¸Ÿà¸™à¸žà¸£à¹‰à¸­à¸¡à¹à¸¥à¹‰à¸§!", gL: "à¸„à¸¸à¸“à¹€à¸›à¹‡à¸™à¹€à¸”à¹‡à¸à¸œà¸¹à¹‰à¸Šà¸²à¸¢à¸«à¸£à¸·à¸­à¹€à¸”à¹‡à¸à¸œà¸¹à¹‰à¸«à¸à¸´à¸‡?", gB: "ðŸ‘¦ à¸œà¸¹à¹‰à¸Šà¸²à¸¢", gG: "ðŸ‘§ à¸œà¸¹à¹‰à¸«à¸à¸´à¸‡", pwaBtnMsg: "à¸”à¸²à¸§à¸™à¹Œà¹‚à¸«à¸¥à¸”à¹„à¸­à¸„à¸­à¸™ (à¹€à¸‚à¹‰à¸²à¸–à¸¶à¸‡à¹‚à¸”à¸¢à¸•à¸£à¸‡)", pwaTitle: "à¸žà¸² Kuboki à¹„à¸›à¸”à¹‰à¸§à¸¢!", pwaGotIt: "à¹€à¸‚à¹‰à¸²à¹ƒà¸ˆà¹à¸¥à¹‰à¸§!" },
        'tl': { n: "Pangalan mo:", p: "Isulat dito...", b: "LARO TAYO!", e: "Ilang taon ka na?", f: "Piliin ang bandera:", g: "Kamusta! Ako ang kaibigan mong Kuboki", m: "I-CLICK ANG MIKROPONO PARA MAKAUSAP SI KUBOKI!", mr: "HANDA NA ANG MIKROPONO!", gL: "Lalaki ka ba o Babae?", gB: "ðŸ‘¦ Lalaki", gG: "ðŸ‘§ Babae", pwaBtnMsg: "I-download ang Icon (Direktang Pag-access)", pwaTitle: "Dalhin si Kuboki!", pwaGotIt: "Nakuha ko!" }
    };
    const key = lang.split('-')[0];
    const t = dic[key] || dic['es'];
    document.getElementById('lbl-nombre').innerText = t.n;
    document.getElementById('nombre').placeholder = t.p;
    document.getElementById('btn-register').innerText = t.b;
    document.getElementById('lbl-edad').innerText = t.e;
    document.getElementById('lbl-bandera').innerText = t.f;
    const lblGreeting = document.getElementById('lbl-greeting');
    if (lblGreeting) lblGreeting.innerText = t.g;

    const lblGenero = document.getElementById('lbl-genero');
    if (lblGenero) lblGenero.innerText = t.gL;

    const btnBoy = document.querySelector('.gender-btn[data-gender="boy"]');
    if (btnBoy) btnBoy.innerHTML = t.gB;

    const btnGirl = document.querySelector('.gender-btn[data-gender="girl"]');
    if (btnGirl) btnGirl.innerHTML = t.gG;

    const lblMic = document.getElementById('mic-status');
    const btnMic = document.getElementById('btn-start-mic');
    if (lblMic && btnMic) {
        if (btnMic.classList.contains('ready')) {
            lblMic.innerText = t.mr;
        } else {
            lblMic.innerText = t.m;
        }
    }
    // Traducciones PWA DinÃ¡micas Activas desde el Diccionario Principal
    const pwaTitle = document.querySelector('#pwa-helper-modal h2');
    if (pwaTitle && t.pwaTitle) pwaTitle.innerText = t.pwaTitle;
                                        
    const pwaBtn = document.querySelector('#pwa-helper-modal button');
    if (pwaBtn && t.pwaGotIt) pwaBtn.innerText = t.pwaGotIt;

    const lblInstall = document.getElementById('lbl-install');
    if (lblInstall && t.pwaBtnMsg) {
        lblInstall.innerText = 'ðŸ“² ' + t.pwaBtnMsg;
    }

    // Extensiones Fase 4/5 para el Hub MÃ¡gico (Las traducciones base + fallback a inglÃ©s)
    const dicHub = {
        'es': { pl: "Plata", or: "Oro", st: "Historias de Kuboki", pt: "Â¡A Pintar!", cl: "Borrar", sv: "Guardar ðŸ’¾" },
        'en': { pl: "Silver", or: "Gold", st: "Kuboki's Stories", pt: "Let's Paint!", cl: "Clear", sv: "Save ðŸ’¾" },
        'pt': { pl: "Prata", or: "Ouro", st: "HistÃ³rias do Kuboki", pt: "Pintar!", cl: "Apagar", sv: "Salvar ðŸ’¾" },
        'fr': { pl: "Argent", or: "Or", st: "Histoires de Kuboki", pt: "Ã€ Peindre!", cl: "Effacer", sv: "Sauver ðŸ’¾" },
        'it': { pl: "Argento", or: "Oro", st: "Storie di Kuboki", pt: "A Dipingere!", cl: "Cancella", sv: "Salva ðŸ’¾" },
        'de': { pl: "Silber", or: "Gold", st: "Kubokis Geschichten", pt: "Zum Malen!", cl: "LÃ¶schen", sv: "Speichern ðŸ’¾" }
    };
    const tHub = dicHub[key] || dicHub['en'];
    
    if (document.getElementById('lbl-plata')) document.getElementById('lbl-plata').innerText = tHub.pl;
    if (document.getElementById('lbl-oro')) document.getElementById('lbl-oro').innerText = tHub.or;
    if (document.getElementById('lbl-historias')) document.getElementById('lbl-historias').innerText = tHub.st;
    if (document.getElementById('lbl-pintar')) document.getElementById('lbl-pintar').innerText = tHub.pt;
    if (document.getElementById('btn-clear-canvas')) document.getElementById('btn-clear-canvas').innerText = tHub.cl;
    if (document.getElementById('btn-save-canvas') && document.getElementById('btn-save-canvas').innerText !== "Guardando..." && !document.getElementById('btn-save-canvas').innerText.includes("!")) {
        document.getElementById('btn-save-canvas').innerText = tHub.sv;
    }
}

// --- 5. LÃ“GICA DE NAVEGACIÃ“N Y EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {

    // Utilidad de Reset de Pruebas
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === '1') {
        localStorage.removeItem('kuboki_user');
        localStorage.removeItem('kuboki_ai_history');
        if (window.recognition && window.isListening) window.recognition.stop();
        window.location.href = window.location.pathname; // Limpia la url
        return; // Detiene la ejecuciÃ³n para reiniciar limpio
    }

    const btnResetSession = document.getElementById('btn-reset-session');
    if (btnResetSession) {
        btnResetSession.onclick = () => {
            localStorage.removeItem('kuboki_user');
            localStorage.removeItem('kuboki_ai_history');
            window.location.href = window.location.pathname + '?reset=1';
        };
    }
    
    // Y reescribimos la funciÃ³n global por si acaso la usan desde el HTML
    window.resetSession = function() {
        localStorage.removeItem('kuboki_user');
        localStorage.removeItem('kuboki_ai_history');
        if (window.recognition) { try { window.recognition.stop(); } catch(e){} }
        window.location.href = window.location.pathname + '?reset=1';
    };

    // --- PWA: LOGICA DE INSTALACIÃ“N ---
    let deferredPrompt;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const installContainer = document.getElementById('install-container');

    if (installContainer && !isStandalone) {
        installContainer.style.display = 'block'; // Mostrar si entra desde Safari/Chrome y no estÃ¡ instalada
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installContainer) installContainer.style.display = 'block';
    });

    const btnInstall = document.getElementById('btn-install');
    if (btnInstall) {
        btnInstall.onclick = async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted' && installContainer) {
                    installContainer.style.display = 'none';
                }
                deferredPrompt = null;
            } else {
                // Mostrar modal amigable en vez de alertas asustadizas
                const modal = document.getElementById('pwa-helper-modal');
                const instr = document.getElementById('pwa-instructions');
                if (modal && instr) {
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                    const isAndroid = /android/i.test(navigator.userAgent);
                    
                    const lang = (window.userData && window.userData.idioma) ? window.userData.idioma : 'es';
                    const isPT = lang.startsWith('pt');
                    const isEN = lang.startsWith('en');

                    if (isIOS) {
                        instr.innerHTML = isPT ? "Para instalar: Toque no Ã­cone <strong>Compartilhar</strong> (quadrado com seta) e selecione <strong>'Adicionar Ã  Tela de InÃ­cio'</strong> âž•." :
                                          isEN ? "To install: Tap the <strong>Share</strong> icon (square with arrow) and select <strong>'Add to Home Screen'</strong> âž•." :
                                          "Para instalarlo en iPhone: Toca el Ã­cono <strong>Compartir</strong> cuadrado con la flecha y luego selecciona <strong>'Agregar a inicio'</strong> âž•.";
                        modal.style.display = 'flex';
                    } else if (isAndroid) {
                        alert("âš ï¸ Google (Android) bloqueÃ³ el botÃ³n 'Aceptar y Descargar' porque estÃ¡s haciendo la prueba en la red WiFi local sin seguridad.\n\nPara poder descargar la App con 1-Solo-Clic presionado Aceptar, por favor realiza la prueba desde tu enlace seguro de TUNNEL (HTTPS).");
                    } else {
                        // Escritorio
                        instr.innerHTML = "Tu navegador no es compatible con instalaciones directas desde este enlace local. Usa HTTPS.";
                        modal.style.display = 'flex';
                    }
                }
            }
        };
    }
    // --- FIN PWA ---

    // FASE 4: PERSISTENCIA DE SESIÃ“N
    const savedSession = localStorage.getItem('kuboki_user');
    if (savedSession) {
        try {
            userData = JSON.parse(savedSession);
            console.log("SesiÃ³n restaurada para:", userData.nombre);

            // Reconstituimos el estado en background y pausamos para asegurar la interacciÃ³n del usuario
            setTimeout(() => {
                document.getElementById('intro-screen').classList.remove('active');
                document.getElementById('registration-screen').classList.remove('active');

                const resumeScreen = document.getElementById('resume-screen');
                if (resumeScreen) {
                    resumeScreen.classList.add('active');

                    // Traducir pantalla de rescate rÃ¡pidamente antes de mostrarla
                    const isPT = userData.idioma.startsWith('pt');
                    const isEN = userData.idioma.startsWith('en');

                    const rTitle = resumeScreen.querySelector('h1');
                    if (rTitle) rTitle.innerText = isPT ? `OlÃ¡ novamente!` : (isEN ? `Welcome back!` : `Â¡Hola de nuevo!`);
                    
                    const rBtn = document.getElementById('btn-resume');
                    if (rBtn) rBtn.innerText = isPT ? `Continuar ðŸš€` : (isEN ? `Continue ðŸš€` : `Continuar ðŸš€`);

                    document.getElementById('btn-resume').onclick = async () => {
                        sonarEfecto('brillo');
                        iniciarMusicaAmbiente();
                        
                        // FASE 4: Solicitar permisos de micrÃ³fono al usuario en el momento de interactuar silenciosamente
                        try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { console.warn(e); }

                        resumeScreen.classList.remove('active');
                        
                        const interactiveWorld = document.getElementById('interactive-world');
                        if (interactiveWorld) {
                            interactiveWorld.style.display = 'block';
                            interactiveWorld.classList.add('active');

                            const childGreeting = document.getElementById('child-greeting');
                            if (childGreeting) {
                                childGreeting.innerText = isPT ? `OlÃ¡ novamente, ${userData.nombre}!` : 
                                                          isEN ? `Welcome back, ${userData.nombre}!` : 
                                                          `Â¡Hola de nuevo, ${userData.nombre}!`;
                            }

                            if (typeof traducirInterfaz === 'function') {
                                traducirInterfaz(userData.idioma);
                            }

                            if (window.initAITutor) window.initAITutor(userData);
                        }
                    };
                }
            }, 500); // PequeÃ±o delay para permitir que el CSS/DOM fije las clases bÃ¡sicas
        } catch (e) {
            console.error("Error leyendo cachÃ© local:", e);
        }
    }

    // FLUJO DE INTRODUCCIÃ“N Y VIDEO
    const btnLogo = document.getElementById('btn-logo');
    const videoContainer = document.getElementById('video-container');
    const introVideo = document.getElementById('intro-video');
    const btnSkipVideo = document.getElementById('btn-skip-video');
    const introScreen = document.getElementById('intro-screen');
    const registrationScreen = document.getElementById('registration-screen');

    function finalizarVideo() {
        introVideo.pause();
        introScreen.style.display = 'none'; // EVITA QUE TAPE EL REGISTRO
        videoContainer.style.display = 'none'; // EVITA QUE 'FIXED' TAPE LA PANTALLA
        introScreen.classList.remove('active');
        registrationScreen.classList.add('active');
        // La mÃºsica ya no inicia aquÃ­, inicia con el clic inicial en el logo.
    }

    if (btnLogo) {
        btnLogo.onclick = function () {
            sonarEfecto('brillo');
            btnLogo.style.display = 'none';
            videoContainer.style.display = 'flex';

            // Iniciar mÃºsica de fondo al mismo tiempo que el video
            iniciarMusicaAmbiente();

            // Salto de emergencia extendido: 20 segundos para cargar en conexiones mÃ³viles lentas
            const timeoutVideo = setTimeout(() => {
                if (introVideo.currentTime === 0 || introVideo.paused) {
                    console.log("Internet mÃ³vil demasiado lento para el video, saltando forzadamente.");
                    finalizarVideo();
                }
            }, 20000);

            // Ocultar pre-loader si el video logra reproducirse
            introVideo.onplaying = () => {
                clearTimeout(timeoutVideo);
                const loader = document.getElementById('video-loader');
                if (loader) loader.style.display = 'none';
            };

            // Intento de reproducir video con sonido (permitido tras clic)
            introVideo.volume = 1.0;
            introVideo.load();
            introVideo.play().catch(e => {
                console.error("No se pudo auto-reproducir el video.", e);
                finalizarVideo(); // Si falla, pasamos directo al registro
            });
        };
    }

    if (introVideo) {
        introVideo.onended = finalizarVideo;
    }

    if (btnSkipVideo) {
        btnSkipVideo.onclick = finalizarVideo;
    }

    // ----------------------------------------------------
    // Se eliminÃ³ el botÃ³n manual de micrÃ³fono. Los permisos 
    // ahora se solicitan auto-mÃ¡gicamente al presionar "Â¡A Jugar!".
    // ----------------------------------------------------

    // BANDERAS (Interactividad de idiomas sin recargar)
    document.querySelectorAll('.flag-item').forEach(flag => {
        flag.onclick = () => {
            sonarEfecto('pop');
            const imgEl = flag.querySelector('img');
            userData.bandera = imgEl ? imgEl.alt : flag.textContent.trim();
            userData.idioma = flag.dataset.lang;
            document.querySelectorAll('.flag-item').forEach(f => f.classList.remove('selected'));
            flag.classList.add('selected');
            traducirInterfaz(userData.idioma);
        };
    });

    // LÃ“GICA BOTÃ“N COPPA (TraducciÃ³n IA)
    const btnCoppa = document.getElementById('btn-legal-coppa');
    const modalCoppa = document.getElementById('modal-coppa');
    const btnCloseCoppa = document.getElementById('btn-close-coppa');
    
    if (btnCoppa && modalCoppa) {
        btnCoppa.onclick = async () => {
            sonarEfecto('pop');
            modalCoppa.style.display = 'flex';
            const contentDiv = document.getElementById('coppa-content');
            
            // Texto por defecto
            contentDiv.innerHTML = `
                <div style="text-align: center; padding: 40px 0;">
                    <div class="spinner" style="width:40px; height:40px; border:4px solid #eee; border-top:4px solid #1e90ff; border-radius:50%; animation:spin 1s linear infinite; margin: 0 auto;"></div>
                    <p style="margin-top: 15px; color: #666; font-weight: bold;">Traduciendo documento legal con IA de forma segura...</p>
                </div>`;
            
            // Detectar idioma
            let targetLang = 'es-ES';
            if (userData && userData.idioma) {
                targetLang = userData.idioma;
            } else {
                targetLang = navigator.language || 'es-ES';
            }

            const legalTextES = \`ðŸ›¡ï¸ Aviso Legal y Privacidad Infantil (COPPA & YouTube)
Compromiso de Seguridad de Kuboki

En Kuboki, la seguridad y la privacidad de los mÃ¡s pequeÃ±os son nuestra mÃ¡xima prioridad. Este sistema ha sido desarrollado bajo el principio de Privacidad por DiseÃ±o para cumplir estrictamente con la Ley de ProtecciÃ³n de la Privacidad Infantil en LÃ­nea (COPPA) y las directrices de contenido para niÃ±os de YouTube.

1. RecolecciÃ³n de Datos Zero-Storage
Informamos a los padres y tutores que este panel y nuestra aplicaciÃ³n interactiva no recopilan, no almacenan ni comparten InformaciÃ³n de IdentificaciÃ³n Personal (PII) de los menores (como nombres reales, direcciones o correos electrÃ³nicos).

2. Adherencia a la Ley COPPA
Cumplimos Ã­ntegramente con los estÃ¡ndares de COPPA:
- Sin perfiles persistentes: No rastreamos el comportamiento del menor fuera de la experiencia de juego necesaria para la interacciÃ³n con la IA.
- Sin publicidad segmentada: No permitimos anuncios de terceros que utilicen datos de comportamiento dentro de nuestra plataforma.
- Control Parental: Cualquier acceso a funciones externas o de configuraciÃ³n estÃ¡ protegido por un panel de control exclusivo para adultos.

3. IntegraciÃ³n con YouTube
Nuestro contenido estÃ¡ vinculado a los canales oficiales de YouTube de Kuboki, los cuales estÃ¡n configurados bajo la etiqueta "Creado para niÃ±os" (Made for Kids). Esto garantiza que la navegaciÃ³n sea segura y que se apliquen automÃ¡ticamente las restricciones de privacidad de Google para menores de 13 aÃ±os.

4. IA con Memoria Local
La interacciÃ³n con nuestro Tutor de IA se procesa para mejorar la experiencia educativa inmediata, pero los datos de estas interacciones no se utilizan para crear bases de datos comerciales ni se venden a terceros.

Al utilizar este sistema, usted acepta que Kuboki actÃºa como un entorno seguro y controlado, dedicado exclusivamente al entretenimiento y la educaciÃ³n infantil en un marco de respeto total a la legislaciÃ³n internacional de privacidad.\`;

            if (targetLang.toLowerCase().startsWith('es')) {
                contentDiv.innerHTML = legalTextES.replace(/\\n/g, '<br>');
                return;
            }

            // Llamar a Groq API si no es espaÃ±ol
            if (typeof window.translateLegalText === 'function') {
                const translated = await window.translateLegalText(targetLang, legalTextES);
                if (translated) {
                    contentDiv.innerHTML = translated.replace(/\\n/g, '<br>');
                } else {
                    contentDiv.innerHTML = "<p style='color:red;'>Error de red al traducir.</p><br>" + legalTextES.replace(/\\n/g, '<br>');
                }
            } else {
                contentDiv.innerHTML = legalTextES.replace(/\\n/g, '<br>');
            }
        };

        btnCloseCoppa.onclick = () => {
            sonarEfecto('pop');
            modalCoppa.style.display = 'none';
        };
    }

    // EDAD
    document.querySelectorAll('.age-btn').forEach(btn => {
        btn.onclick = () => {
            sonarEfecto('pop');
            // Guardamos como nÃºmero real
            userData.edad = parseInt(btn.dataset.age, 10);
            document.querySelectorAll('.age-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
    });

    // GENERO (Fase 5)
    userData.genero = "";
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.onclick = () => {
            sonarEfecto('pop');
            userData.genero = btn.dataset.gender;
            document.querySelectorAll('.gender-btn').forEach(b => {
                b.style.borderColor = '#333';
                b.style.background = 'rgba(255,255,255,0.1)';
            });
            btn.style.borderColor = '#9333ea';
            btn.style.background = 'rgba(147, 51, 234, 0.3)';
        };
    });

    // BOTÃ“N Â¡A JUGAR! (Paso a Fase 2 - Base de Datos)
    document.getElementById('btn-register').onclick = async () => {
        // Solicitar silenciosamente el permiso en segundo plano sin congelar UI
        try { navigator.mediaDevices.getUserMedia({ audio: true }).catch(e => console.warn(e)); } catch(e){}

        // VALIDACIÃ“N DE ESTRUCTURA SUPABASE
        if (!window.supabase) {
            alert('âŒ Error de conexiÃ³n: No se pudo cargar el mÃ³dulo de base de datos. Verifica tu conexiÃ³n a internet.');
            return;
        }

        userData.nombre = document.getElementById('nombre').value.trim();
        
        // Relajar las validaciones estrictas para que no bloquee UX si olvida botones nuevos
        if (!userData.nombre) {
            alert("Â¡Escribe un nombre mÃ¡gico para jugar!");
            return;
        }
        // Autocompletar defaults si faltan datos en lugar de bloquearlos en la pantalla 1
        if (!userData.bandera) userData.bandera = 'es';
        if (!userData.edad) userData.edad = 5;
        if (!userData.genero) userData.genero = 'boy';
        if (!userData.idioma) userData.idioma = 'es-ES';

        // Mostrar un estado de "Cargando..." o deshabilitar botÃ³n mientras guarda
        const btnReg = document.getElementById('btn-register');
        btnReg.disabled = true;
        btnReg.innerText = 'Guardando...';

        // Preparamos los datos EXACTOS requeridos por la tabla usuarios_kuboki
        // FASE 5: Inicializando economÃ­a y mascotas
        userData.huevos_plata = 0;
        userData.huevos_oro = 0;
        userData.mascota_activa = null;

        const payload = {
            nombre: userData.nombre,
            edad: userData.edad,
            idioma: userData.idioma,
            genero: userData.genero,
            huevos_plata: userData.huevos_plata,
            huevos_oro: userData.huevos_oro,
            mascota_activa: userData.mascota_activa,
            fase: 1, // Fase inicial por defecto
            fecha: new Date().toISOString()
        };

        try {
            const { error } = await _supabase.from('usuarios_kuboki').insert([payload]);
            if (error) console.warn("Supabase insert warn:", error.message);
        } catch(e) { console.warn("Fallo red/DB, jugando offline:", e); }

        // Mover a la siguiente pantalla sin importar si hay internet o no
        document.getElementById('registration-screen').classList.remove('active');

        // FASE 4: GUARDAR EN CACHÃ‰ LOCAL y NUBE de forma segura
        try { await syncProgress(); } catch(e) {}

        // TransiciÃ³n Kuboki
            const baseLang = userData.idioma.split('-')[0];
            const transDict = {
                'es': { welcome: `Â¡Hola ${userData.nombre}! Â¡Bienvenido!`, treeGreet: "Â¡Bienvenido al Bosque!", treeStatus: "El Ãrbol te escucha..." },
                'en': { welcome: `Hello ${userData.nombre}! Welcome!`, treeGreet: "Welcome to the Forest!", treeStatus: "The Tree is listening..." },
                'pt': { welcome: `OlÃ¡ ${userData.nombre}! Bem-vindo!`, treeGreet: "Bem-vindo Ã  Floresta!", treeStatus: "A Ãrvore te escuta..." },
                'fr': { welcome: `Bonjour ${userData.nombre}! Bienvenue!`, treeGreet: "Bienvenue dans la ForÃªt!", treeStatus: "L'Arbre vous Ã©coute..." },
                'it': { welcome: `Ciao ${userData.nombre}! Benvenuto!`, treeGreet: "Benvenuto nella Foresta!", treeStatus: "L'Albero ti ascolta..." },
                'de': { welcome: `Hallo ${userData.nombre}! Willkommen!`, treeGreet: "Willkommen im Wald!", treeStatus: "Der Baum hÃ¶rt zu..." }
            };
            const wText = transDict[baseLang] || transDict['en'];

            const transitionScreen = document.getElementById('kuboki-transition-screen');
            if (transitionScreen) {
                transitionScreen.classList.add('active');
                document.getElementById('kuboki-transition-text').innerText = wText.welcome;
                
                // Usar voz realista OpenAI TTS con un ligero retraso de medio segundo para impacto dramÃ¡tico
                setTimeout(() => {
                    if (window.speakText) {
                        window.speakText(wText.welcome);
                    } else if (typeof decir === 'function') {
                        decir(wText.welcome);
                    }
                }, 500);

                setTimeout(() => {
                    transitionScreen.classList.remove('active');
                    
                    // Fase 4: Lanzar el Mundo Interactivo y el Tutor IA
                    const interactiveWorld = document.getElementById('interactive-world');
                    if (interactiveWorld) {
                        interactiveWorld.style.display = 'block';
                        interactiveWorld.classList.add('active');

                        // Actualizar UI del mundo
                        const cGreet = document.getElementById('child-greeting');
                        if (cGreet) cGreet.innerText = wText.treeGreet;
                        const cStat = document.getElementById('child-status');
                        if (cStat) cStat.innerText = wText.treeStatus;
                        // Inicializar el Cerebro IA (Groq + OpenAI TTS)
                        if (window.initAITutor) {
                            window.initAITutor(userData);
                        }
                    }
                }, 3500);
            }
            // Restaurar botÃ³n oculto tras inicio exitoso de secuencia
            btnReg.disabled = false;
    };

    // LÃ“GICA DE DIBUJO REMOVIDA: AHORA ESTÃ EN modulo_pintar.js (LAZY LOAD)

    // FASE 5: SISTEMA DE GAMIFICACIÃ“N (HUEVOS) Y MASCOTAS
    function updateEggHUD() {
        if (document.getElementById('val-silver')) document.getElementById('val-silver').innerText = userData.huevos_plata || 0;
        if (document.getElementById('val-gold')) document.getElementById('val-gold').innerText = userData.huevos_oro || 0;
    }

    function showEggPopup(type) {
        const popup = document.createElement('div');
        popup.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%) scale(0); width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:99999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:white; font-family:sans-serif; transition:transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);';
        
        const eggIcon = type === 'gold' ? 'ðŸŒŸðŸ¥šðŸŒŸ' : 'ðŸ¥š';
        const title = type === 'gold' ? 'Â¡NUEVO HUEVO DE ORO!' : 'Â¡GANASTE 1 HUEVO DE PLATA!';
        const color = type === 'gold' ? 'gold' : 'silver';
        
        popup.innerHTML = `
            <div style="font-size: 8rem; animation: pulse-logo 1s infinite;">${eggIcon}</div>
            <h1 style="color: ${color}; font-size: 3rem; text-shadow: 0 0 20px ${color}; text-align:center;">${title}</h1>
            <p style="font-size: 1.5rem; text-align:center; max-width:80%;">Sigue aprendiendo para ganar mÃ¡s premios.</p>
        `;
        document.body.appendChild(popup);
        
        // Efecto de entrada
        setTimeout(() => popup.style.transform = 'translate(-50%, -50%) scale(1)', 10);
        
        // Efecto de salida y destrucciÃ³n
        setTimeout(() => {
            popup.style.transform = 'translate(-50%, -50%) scale(0)';
            setTimeout(() => document.body.removeChild(popup), 500);
        }, 3000);
    }

    function rewardEgg(type = 'silver') {
        if (window.StorageManager) {
            window.StorageManager.addHuevos(1);
            if(typeof userData !== 'undefined') {
                userData.huevos_plata = window.StorageManager.getState().saldo_huevos;
            }
        } else {
            if (!userData.huevos_plata) userData.huevos_plata = 0;
            userData.huevos_plata++;
        }

        sonarEfecto('pop');
        showEggPopup('silver');
        
        updateEggHUD();
        if (typeof syncProgress === 'function') syncProgress();
    }
            }
        }
    }

    // Eventos de la Incubadora
    document.querySelectorAll('.pet-egg-item').forEach(egg => {
        egg.onclick = () => {
            sonarEfecto('pop');
            userData.mascota_activa = egg.dataset.pet;
            userData.nivel_mascota = 1;
            syncProgress();
            const adoptedPet = egg.dataset.pet;
            if (window.askGroq) window.askGroq(`[System Message: The child just adopted the ${adoptedPet} pet from the incubator! Congratulate them excitedly and tell them to take good care of it in the interactive world. CRITICAL: SPEAK EXCLUSIVELY IN THE LANGUAGE CODE: ${userData.idioma}.]`);
            document.getElementById('pet-incubator').style.display = 'none';
            document.getElementById('interactive-world').style.display = 'block';
        };
    });

    document.getElementById('btn-back-to-hub')?.addEventListener('click', () => {
        document.getElementById('pet-incubator').style.display = 'none';
        document.getElementById('interactive-world').style.display = 'block';
        updatePetUI(); // Renderizamos la nueva mascota en el Hub 
    });

    // LÃ“GICA DE MASCOTA VIRTUAL REMOVIDA: AHORA ESTÃ EN modulo_mascota.js (LAZY LOAD)


    // FASE 4/5/6: YOUTUBE INTEGRATION (Historias filtradas por idioma)
    
    // INTEGRACIÃ“N YOUTUBE API PARA EVENTO ON-ENDED
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0] || document.body;
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = function() {
        window.ytPlayer = new window.YT.Player('youtube-iframe', {
            events: {
                'onStateChange': onPlayerStateChange
            }
        });
    };

    function cerrarVideoMundial(finishedNaturale = false) {
        document.getElementById('youtube-player-container').style.display = 'none';
        const iframe = document.getElementById('youtube-iframe');
        if (iframe) iframe.src = ""; // Cortar reproducciÃ³n para que no suene de fondo
        window.isViewingMedia = false; // Desbloquear mic
        
        // Destruir Fullscreen si estÃ¡ activo en el navegador mÃ³vil
        try {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (document.webkitFullscreenElement) {
                document.webkitExitFullscreen();
            }
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
        } catch(e) {}

        // Si se cerrÃ³ porque el niÃ±o se aburriÃ³ antes de tiempo
        if (finishedNaturale !== true && window.askGroq) {
             setTimeout(() => {
                 window.askGroq(`[System Message: The child closed the video early. Ask them gently: "Do you want to watch another video or paint instead?". Keep it extremely short. CRITICAL RULE: YOU MUST SPEAK EXCLUSIVELY IN THE NATIVE LANGUAGE CODE: ${userData.idioma}.]`);
             }, 500);
        } else if (window.startListening) {
             setTimeout(window.startListening, 1500);
        }
    }

    function onPlayerStateChange(event) {
        if (event.data === window.YT.PlayerState.ENDED) {
            cerrarVideoMundial(true);
            
            // Â¡Recompensa por terminar el video completo comprobada por YT API!
            rewardEgg('silver');

            // Despertar al Ãrbol y convertirlo en el personaje que anuncia los premios alegremente
            if (window.askGroq) {
                // Obtenemos los metadatos del Ãºltimo video visto
                let promptContext = "";
                if (window.LAST_WATCHED_VIDEO) {
                    const desc = window.LAST_WATCHED_VIDEO.description.substring(0, 300); // Resumen para no exceder tokens
                    promptContext = `[System Message: El niÃ±o acaba de terminar de ver el video titulado: "${window.LAST_WATCHED_VIDEO.title}". La descripciÃ³n del video es: "${desc}". Tu tarea ahora: felicÃ­talo por ganar un Huevo de Plata (Silver Egg). Luego, hazle un comentario amistoso sobre lo que pasÃ³ en el video basÃ¡ndote en la descripciÃ³n, y pregÃºntale exactamente esto: "Â¿Te gustÃ³? Â¿Quieres ver otro video parecido, quieres ver una historia diferente, o prefieres pintar?". CRÃTICO: HABLA EXCLUSIVAMENTE EN EL IDIOMA: ${userData.idioma}. Usa lenguaje simple y divertido para niÃ±os.]`;
                } else {
                    promptContext = `[System Message: El niÃ±o acaba de terminar de ver el video. Tu tarea ahora: felicÃ­talo por ganar un Huevo de Plata (Silver Egg) por ver el video, y pregÃºntale: "Â¿Te gustÃ³? Â¿Quieres volver a verlo, quieres ver otro video, o simplemente quieres pintar?". MantÃ©nlo corto. CRÃTICO: HABLA EXCLUSIVAMENTE EN EL IDIOMA CÃ“DIGO: ${userData.idioma}.]`;
                }
                
                window.askGroq(promptContext);
            }
        }
    }

    document.getElementById('btn-close-video')?.addEventListener('click', () => cerrarVideoMundial(false));

    function getKubokiVideoID(keyword) {
        const langCode = userData.idioma.split('-')[0];
        const targetChannel = CHANNEL_MAP[langCode] || CHANNEL_MAP['default'];
        
        // 1. BÃºsqueda en la Base de Datos Real DinÃ¡mica
        if (window.KUBOKI_VIDEO_DB_REAL && window.KUBOKI_VIDEO_DB_REAL.length > 0) {
            let filtered = window.KUBOKI_VIDEO_DB_REAL.filter(v => v.channel_id === targetChannel);
            
            // Si hay un keyword (ej: panda), filtramos aÃºn mÃ¡s
            if (keyword) {
                let keyLower = keyword.toLowerCase();
                // Si la palabra clave es un cÃ³digo de burbuja, la simplificamos
                if (keyLower === 'pandabamboo') keyLower = 'panda';
                if (keyLower === 'leofire') keyLower = 'lÃ¶we'; // leÃ³n en alemÃ¡n
                if (keyLower === 'dinowater') keyLower = 'dinosaurier';
                
                let matches = filtered.filter(v => 
                    v.title.toLowerCase().includes(keyLower) || 
                    v.description.toLowerCase().includes(keyLower)
                );
                
                if (matches.length > 0) filtered = matches;
            }
            
            if (filtered.length > 0) {
                // Elegir aleatoriamente para no repetir
                const randomIndex = Math.floor(Math.random() * filtered.length);
                const chosenVideo = filtered[randomIndex];

                // LANGUAGE GUARD: VerificaciÃ³n de Fuga de Video
                if (window.LanguageGuard && !window.LanguageGuard.validateVideoContext(chosenVideo.channel_id)) {
                    console.error("[LanguageGuard] Video bloqueado. Retornando fallback seguro.");
                    return 'JOkaDb46qDs'; // Fallback genÃ©rico ultra-seguro (espaÃ±ol por defecto o el id de un video neutral)
                }

                window.LAST_WATCHED_VIDEO = chosenVideo; // Guardamos para la reacciÃ³n post-video
                return chosenVideo.id;
            }
        }
        
        // 2. Fallback al sistema Legacy si la base real falla o no encuentra
        if (keyword && window.KUBOKI_VIDEO_DB && window.KUBOKI_VIDEO_DB[keyword]) {
            const videoData = window.KUBOKI_VIDEO_DB[keyword];
            return videoData.links[langCode] || videoData.links['es'] || videoData.links['default'];
        }

        // 3. Fallback genÃ©rico final
        if (langCode === 'de') return 'MkvcCrAYQqQ'; // AlemÃ¡n
        if (langCode === 'ja') return 'RjeGUNQauKc'; // JaponÃ©s
        return 'JOkaDb46qDs'; // EspaÃ±ol Default
    }

    window.executeAIAction = function(cmd) {
        if (!cmd) return false;
        cmd = cmd.trim().toUpperCase();
        console.log("Ejecutando acción maestra UI: ", cmd);

        // ANTI-GHOSTING MASTER COMMAND: Limpiar módulo previo antes de arrancar uno nuevo
        if (window.activeKubokiModule && typeof window.activeKubokiModule.destroy === 'function') {
            console.log("[Anti-Ghosting] Destruyendo módulo anterior preventivamente...");
            window.activeKubokiModule.destroy();
            window.activeKubokiModule = null;
        }

        if (cmd.startsWith('PLAY_VIDEO')) {
            const parts = cmd.split(':');
            const videoRequested = parts.length > 1 ? parts[1].toLowerCase() : null;
            
            window.pendingVideoID = getKubokiVideoID(videoRequested);
            
            const iframe = document.getElementById('youtube-iframe');
            if (iframe) {
                // Dejamos el micrÃ³fono ACTIVO para que el niÃ±o pueda hablar con el Ã¡rbol y pedirle que quite el video
                window.isViewingMedia = false; 

                // Si la API de YT estÃ¡ lista, usamos loadVideoById. Si no, fallback a iframe.src
                if (window.ytPlayer && window.ytPlayer.loadVideoById) {
                    window.ytPlayer.loadVideoById(window.pendingVideoID);
                } else {
                    iframe.src = `https://www.youtube.com/embed/${window.pendingVideoID}?autoplay=1&rel=0&enablejsapi=1`;
                }
                
                const container = document.getElementById('youtube-player-container');
                container.style.display = 'flex'; 
                
                // RETENCIÃ“N DE 30 SEGUNDOS: Ocultar botÃ³n de cierre para que no cambien de video enseguida
                const btnCerrar = document.getElementById('btn-close-video');
                if (btnCerrar) {
                    btnCerrar.style.display = 'none'; // Desaparecer temporalmente
                    if (window.videoTimer) clearTimeout(window.videoTimer);
                    window.videoTimer = setTimeout(() => {
                        btnCerrar.style.display = 'flex'; // Reaparecer botÃ³n de escape a los 30s
                    }, 30000); 
                }

                // Forzar inmersiÃ³n total Fullscreen Nativa para apps mÃ³viles 
                try {
                    if (container.requestFullscreen) {
                        container.requestFullscreen().then(() => {
                            if (screen.orientation && screen.orientation.lock) {
                                screen.orientation.lock('landscape').catch(e => console.log("Orientation lock fallÃ³, el usuario debe girarlo manual", e));
                            }
                        }).catch(e=>console.log(e));
                    } else if (container.webkitRequestFullscreen) {
                        container.webkitRequestFullscreen();
                    }
                } catch(e) { console.error("Fullscreen API fallÃ³", e); }

                window.pendingVideoID = null;
                return true;
            }
        } else if (cmd === 'STOP_VIDEO') {
            cerrarVideoMundial();
            return true;
        } else if (cmd === 'OPEN_PAINT') {
            if (window.initGamePaint) {
                window.initGamePaint();
            } else {
                const script = document.createElement('script');
                script.src = 'game_paint.js';
                script.onload = () => window.initGamePaint();
                document.body.appendChild(script);
            }
            return true;
        } else if (cmd === 'OPEN_PET') {
            if (window.initGamePet) {
                window.initGamePet();
            } else {
                const script = document.createElement('script');
                script.src = 'game_pet.js';
                script.onload = () => window.initGamePet();
                document.body.appendChild(script);
            }
            return true;
        } else if (cmd === 'OPEN_BALLOONS') {
            if (window.initGameBalloons) {
                window.initGameBalloons();
            } else {
                const script = document.createElement('script');
                script.src = 'game_balloons.js';
                script.onload = () => window.initGameBalloons();
                document.body.appendChild(script);
            }
            return true;
        } else if (cmd === 'OPEN_FACE') {
            if (window.initGameFace) {
                window.initGameFace();
            } else {
                const script = document.createElement('script');
                script.src = 'game_face.js';
                script.onload = () => window.initGameFace();
                document.body.appendChild(script);
            }
            return true;
        } else if (cmd === 'OPEN_MOLES') {
            if (window.initGameMoles) {
                window.initGameMoles();
            } else {
                const script = document.createElement('script');
                script.src = 'game_moles.js';
                script.onload = () => window.initGameMoles();
                document.body.appendChild(script);
            }
            return true;
        } else if (cmd === 'OPEN_PIANO') {
            if (window.initGamePiano) {
                window.initGamePiano();
            } else {
                const script = document.createElement('script');
                script.src = 'game_piano.js';
                script.onload = () => window.initGamePiano();
                document.body.appendChild(script);
            }
            return true;
        } else if (cmd === 'OPEN_STORE') {
            if (window.initGameStore) {
                window.initGameStore();
            } else {
                const script = document.createElement('script');
                script.src = 'game_store.js';
                script.onload = () => window.initGameStore();
                document.body.appendChild(script);
            }
            return true;
        } else if (cmd === 'PLAY_PANDA') {
            window.pendingVideoID = getKubokiVideoID('panda'); 
            window.executeAIAction('PLAY_VIDEO');
            return true;
        } else if (cmd === 'PLAY_LEON') {
            window.pendingVideoID = getKubokiVideoID('leon'); 
            window.executeAIAction('PLAY_VIDEO');
            return true;
        }
        return false;
    };

    document.querySelectorAll('.story-bubbles .char-item').forEach(bubble => {
        bubble.onclick = () => {
            sonarEfecto('pop');
            const vidId = bubble.getAttribute('data-vid');

            // Eliminar asignaciÃ³n de fallback porque executeAIAction ahora usa la base de datos
            window.pendingVideoID = null;

            // --- INYECTAR LA NARRATIVA AL CEREBRO DE GROQ SEGÃšN LA BURBUJA TOCADA ---
            if (window.askGroq) {
                let contextPrompt = "";
                
                if (vidId === 'pandabamboo') {
                    contextPrompt = `[System Message: El niÃ±o tocÃ³ la burbuja del Panda. 
NARRATIVA DEL VÃDEO QUE EL NIÃ‘O VERÃ YA MISMO: Los Trols atan al Panda, caen 10 huevos, nacen animales, el dragÃ³n bebÃ© quema las sogas y salva al Panda.
TU TAREA INMEDIATA AHORA:
Reacciona emocionada/o a la historia anunciÃ¡ndole que la historia va a empezar ya mismo (ej: "Â¡Ohhh! Vamos a ver cÃ³mo salvan al Panda!") e INCLUYE ESTE CÃ“DIGO EXACTAMENTE AL FINAL PARA DAR PLAY: ||CMD:PLAY_VIDEO||
REGLA CRÃTICA UNIVERSAL: Â¡HABLA SOLO EN EL IDIOMA CÃ“DIGO: ${userData.idioma}!]`;
                } else if (vidId === 'leofire') {
                    contextPrompt = `[System Message: El niÃ±o tocÃ³ la burbuja del LeÃ³n.
NARRATIVA DEL VÃDEO QUE VERÃ YA MISMO: Panda y bebÃ©s se lanzan por tobogÃ¡n de agua, caen, rÃ­en.
TU TAREA INMEDIATA AHORA:
Reacciona emocionada/o a la historia anunciÃ¡ndole que la diversiÃ³n va a empezar ya mismo e INCLUYE ESTE CÃ“DIGO EXACTAMENTE AL FINAL PARA DAR PLAY: ||CMD:PLAY_VIDEO||
REGLA CRÃTICA UNIVERSAL: Â¡HABLA SOLO EN EL IDIOMA CÃ“DIGO: ${userData.idioma}!]`;
                } else if (vidId === 'dinowater') {
                    contextPrompt = `[System Message: El niÃ±o tocÃ³ la burbuja del Dinosaurio.
NARRATIVA DEL VÃDEO QUE VERÃ YA MISMO: Aventuras divertidas en el bosque.
TU TAREA INMEDIATA AHORA:
Reacciona emocionada/o a la historia anunciÃ¡ndole que la aventura va a empezar ya mismo e INCLUYE ESTE CÃ“DIGO EXACTAMENTE AL FINAL PARA DAR PLAY: ||CMD:PLAY_VIDEO||
REGLA CRÃTICA UNIVERSAL: Â¡HABLA SOLO EN EL IDIOMA CÃ“DIGO: ${userData.idioma}!]`;
                } else if (vidId === 'foxwind') {
                    contextPrompt = `[System Message: El niÃ±o tocÃ³ la burbuja del Zorro/Gatito.
NARRATIVA DEL VÃDEO QUE VERÃ YA MISMO: Magia en el bosque de Kuboki.
TU TAREA INMEDIATA AHORA:
Reacciona emocionada/o a la historia anunciÃ¡ndole que la magia va a empezar ya mismo e INCLUYE ESTE CÃ“DIGO EXACTAMENTE AL FINAL PARA DAR PLAY: ||CMD:PLAY_VIDEO||
REGLA CRÃTICA UNIVERSAL: Â¡HABLA SOLO EN EL IDIOMA CÃ“DIGO: ${userData.idioma}!]`;
                } else {
                    contextPrompt = `[System Message: El niÃ±o quiere ver una historia. Dile alegremente que la historia empezarÃ¡, e incluye EXACTAMENTE al final: ||CMD:PLAY_VIDEO||. HABLA EN IDIOMA: ${userData.idioma}]`;
                }

                if (contextPrompt !== "") {
                    // Si ya estaba escuchando, lo detenemos para procesar la acciÃ³n
                    if (window.recognition && window.isListening) window.recognition.stop();
                    window.askGroq(contextPrompt);
                }
            }
        };
    });
});
// ==========================================
// MÓDULO ZONA DE JUEGOS (IFRAME)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const btnOpenGames = document.getElementById('btn-open-games');
    const gamesHubScreen = document.getElementById('games-hub-screen');
    const btnCloseGames = document.getElementById('btn-close-games');
    
    const gameIframeContainer = document.getElementById('game-iframe-container');
    const gameIframe = document.getElementById('game-iframe');
    const btnExitIframe = document.getElementById('btn-exit-iframe');
    const gameLinkBtns = document.querySelectorAll('.game-link-btn');
    const gameNativeBtns = document.querySelectorAll('.game-native-btn');

    if (btnOpenGames && gamesHubScreen) {
        btnOpenGames.onclick = () => {
            if (typeof sonarEfecto === 'function') sonarEfecto('pop');
            
            // Si el Hub ya está abierto, lo cerramos
            if (gamesHubScreen.style.display === 'flex') {
                gamesHubScreen.style.display = 'none';
                return;
            }
            
            // Ocultar otras pantallas (si es necesario) o simplemente mostrarlo encima
            gamesHubScreen.style.display = 'flex';
            
            // Que Kuboki haga un comentario!
            if (typeof askGroq === 'function' && typeof userData !== 'undefined') {
                askGroq(\[System: El niño acaba de abrir la Zona de Juegos Mágicos. Anímalo brevemente a jugar y divertirse. IDIOMA: \]\, true);
            }
        };
    }

    if (btnCloseGames && gamesHubScreen) {
        btnCloseGames.onclick = () => {
            if (typeof sonarEfecto === 'function') sonarEfecto('pop');
            gamesHubScreen.style.display = 'none';
        };
    }

    function showParentalGate(url, telemetryEvent) {
        if (typeof sonarEfecto === 'function') sonarEfecto('pop');
        const num1 = Math.floor(Math.random() * 5) + 5;
        const num2 = Math.floor(Math.random() * 5) + 2;
        const correct = num1 * num2;
        
        // Uso prompt básico de JS para el Gate de Seguridad (Rápido y compatible)
        const answer = prompt(`Acceso para padres: ¿Cuánto es ${num1} x ${num2}?`);
        
        if (answer && parseInt(answer) === correct) {
            if(window.Telemetry) window.Telemetry.track(telemetryEvent);
            // Feedback Auditivo de Salida
            if (typeof sonarEfecto === 'function') sonarEfecto('brillo');
            
            // Ligero delay para que el niño escuche el "brillo" mágico antes de que el navegador cambie de pestaña
            setTimeout(() => {
                window.open(url, '_blank');
            }, 300);
        } else if (answer !== null) {
            // Si no canceló el prompt pero falló la respuesta
            alert('Respuesta incorrecta. Acceso denegado para mantener la seguridad.');
        }
    }

    // --- RADIO MÁGICA V3 (AUDIO LOCAL) ---
    // Reemplaza la lógica externa de Spotify por reproducción local
    const radioPlayer = new Audio();
    const radioPlaylist = [
        'public/assets/audio/song1.mp3',
        'public/assets/audio/song2.mp3',
        'public/assets/audio/song3.mp3'
    ];
    let currentSongIndex = 0;

    const btnSpotify = document.getElementById('btn-radio-spotify');
    if (btnSpotify) {
        btnSpotify.onclick = () => {
            if(window.Telemetry) window.Telemetry.track('LOCAL_RADIO_PLAY');
            
            // Si ya está reproduciendo, pausarlo
            if (!radioPlayer.paused) {
                radioPlayer.pause();
                if (typeof sonarEfecto === 'function') sonarEfecto('pop');
                btnSpotify.style.animation = 'none'; // Detener feedback visual
                return;
            }
            
            // Reproducir
            if (typeof sonarEfecto === 'function') sonarEfecto('brillo');
            radioPlayer.src = radioPlaylist[currentSongIndex];
            radioPlayer.play().catch(e => console.warn('Error reproduciendo radio local:', e));
            
            // Feedback visual de que la radio está encendida
            btnSpotify.style.animation = 'pulse-logo 1.5s infinite';
            
            // Pasar a la siguiente canción al terminar
            radioPlayer.onended = () => {
                currentSongIndex = (currentSongIndex + 1) % radioPlaylist.length;
                radioPlayer.src = radioPlaylist[currentSongIndex];
                radioPlayer.play();
            };
        };
    }
    
    const btnCine = document.getElementById('btn-cine-youtube');
    if (btnCine) {
        btnCine.onclick = () => {
            showParentalGate('https://youtube.com/@kuboki', 'EXTERNAL_LINK_YOUTUBE');
        };
    }


    // Abrir juego nativo
    gameNativeBtns.forEach(btn => {
        btn.onclick = () => {
            if (typeof sonarEfecto === 'function') sonarEfecto('pop');
            let action = btn.getAttribute('data-action');
            if (action) {
                gamesHubScreen.style.display = 'none'; // Ocultar el hub trasero
                if (window.executeAIAction) {
                    window.executeAIAction(action);
                }
            }
        };
    });

    // Abrir IFrame al tocar un juego
    gameLinkBtns.forEach(btn => {
        btn.onclick = () => {
            if (typeof sonarEfecto === 'function') sonarEfecto('pop');
            let url = btn.getAttribute('data-url');
            if (url) {
                const lang = (typeof userData !== 'undefined' && userData.idioma) ? userData.idioma : 'es-ES'; url = url + (url.includes('?') ? '&' : '?') + 'lang=' + lang; gameIframe.src = url;
                gameIframeContainer.style.display = 'flex';
                gamesHubScreen.style.display = 'none'; // Ocultar el hub trasero
                
                // Pausar música o sonidos de fondo si es necesario
                if (window.emotiveSoundManager) {
                    // TODO: implementar pausa global de sonido si los juegos tienen música
                }
            }
        };
    });

    // Salir del IFrame
    if (btnExitIframe) {
        btnExitIframe.onclick = () => {
            if (typeof sonarEfecto === 'function') sonarEfecto('pop');
            gameIframeContainer.style.display = 'none';
            gameIframe.src = ''; // Limpiar iframe para detener música/procesos del juego
            
            // Opcional: Recompensa automática por jugar!
            if (typeof window.rewardEgg === 'function') {
                window.rewardEgg('silver');
                if (typeof askGroq === 'function') {
                    askGroq(\[System: El niño terminó de jugar en la Zona de Juegos y ganó 1 Huevo de Plata. Felicítalo. IDIOMA: \]\, true);
                }
            }
        };
    }
});



