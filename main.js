import './storage_manager.js';
import './telemetry_manager.js';
import './i18n.js';
import './LanguageGuard.js';
import './kuboki_led_matrix.js';
import './emotive_sound_manager.js';
import './ai_tutor.js';
import './app.js';

// Inicializar Supabase usando Variables de Entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const groqKey = import.meta.env.VITE_GROQ_API_KEY || '';

if (supabaseUrl && supabaseAnonKey && window.supabase) {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ [KUBOKI ENGINE V3] Supabase Client Initialized via Vite.');
    
    // Test de conexión activa
    window.supabaseClient.from('kuboki_jugadores').select('id').limit(1)
        .then(({ data, error }) => {
            if (error) console.error('❌ [TEST SUPABASE] Error conectando a la base de datos:', error.message);
            else console.log('✅ [TEST SUPABASE] Conexión a la base de datos EXITOSA.');
        });
} else {
    console.error('❌ [KUBOKI ENGINE V3] Supabase keys missing. Check Vercel Environment Variables.');
}

// Test de Detección de Variables VITE_
console.log('--- TEST DE VARIABLES VITE ---');
console.log('VITE_GROQ_API_KEY Detectada:', groqKey ? '✅ SÍ' : '❌ NO');
console.log('VITE_SUPABASE_URL Detectada:', supabaseUrl ? '✅ SÍ' : '❌ NO');
console.log('VITE_SUPABASE_ANON_KEY Detectada:', supabaseAnonKey ? '✅ SÍ' : '❌ NO');
console.log('------------------------------');

// Test de Assets (Videos del Árbol)
async function testAssetsExist() {
    const requiredVideos = [
        'public/assets/videos/arbol/idle.mp4',
        'public/assets/videos/arbol/talking.mp4',
        'public/assets/videos/arbol/listening.mp4',
        'public/assets/videos/arbol/happy.mp4'
    ];
    
    let missing = [];
    
    for (const vid of requiredVideos) {
        try {
            // Un fetch con método HEAD para verificar existencia sin descargar el video
            const res = await fetch(vid, { method: 'HEAD' });
            if (!res.ok) {
                missing.push(vid);
            }
        } catch (e) {
            missing.push(vid); // Fallo de red (posiblemente falta el archivo en entorno local)
        }
    }
    
    if (missing.length > 0) {
        console.warn('⚠️ [TEST ASSETS] Faltan los siguientes archivos:', missing);
        alert(`⚠️ ADVERTENCIA DE ASSETS:\nFaltan los siguientes videos del Árbol Mágico:\n\n${missing.join('\n')}\n\nPor favor, súbelos a GitHub/Vercel.`);
    } else {
        console.log('✅ [TEST ASSETS] Todos los videos del Árbol están listos.');
    }
}

// Ejecutar test de assets tras una breve pausa para no bloquear el hilo inicial
setTimeout(testAssetsExist, 2000);

