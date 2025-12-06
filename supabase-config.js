// ========================================
// CONFIGURAZIONE SUPABASE
// ========================================

// 🔧 CONFIGURA QUESTE VARIABILI CON I TUOI DATI SUPABASE
const SUPABASE_CONFIG = {
    // Vai su Supabase → Settings → API e copia:
    URL: 'https://uotvxtivaxmgnpzarsda.supabase.co', // Project URL
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvdHZ4dGl2YXhtZ25wemFyc2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NzE3NzYsImV4cCI6MjA4MDU0Nzc3Nn0.aR5sosyeS3wDT9x93BLBQ79CiD8dpVYlHMr-G7Ggbbo' // anon public key (stringa lunga)
};

// Inizializza Supabase Client
const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.URL,
    SUPABASE_CONFIG.ANON_KEY
);

console.log('✅ Supabase configurato');

// Verifica configurazione
function isSupabaseConfigured() {
    return SUPABASE_CONFIG.URL !== 'https://uotvxtivaxmgnpzarsda.supabase.co' &&
           SUPABASE_CONFIG.ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvdHZ4dGl2YXhtZ25wemFyc2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NzE3NzYsImV4cCI6MjA4MDU0Nzc3Nn0.aR5sosyeS3wDT9x93BLBQ79CiD8dpVYlHMr-G7Ggbbo';
}

if (!isSupabaseConfigured()) {
    console.warn('⚠️ ATTENZIONE: Configura SUPABASE_CONFIG in supabase-config.js');
}