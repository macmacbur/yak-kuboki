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

if (supabaseUrl && supabaseAnonKey && window.supabase) {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log('[KUBOKI ENGINE V3] Supabase Client Initialized via Vite.');
} else {
    console.warn('[KUBOKI ENGINE V3] Supabase keys missing. Offline mode active.');
}

