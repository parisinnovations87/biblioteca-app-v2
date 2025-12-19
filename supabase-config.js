// ========================================
// CONFIGURAZIONE SUPABASE
// ========================================

console.log('📦 Caricamento supabase-config.js...');

// Configurazione Supabase
const SUPABASE_CONFIG = {
    URL: 'https://uotvxtivaxmgnpzarsda.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvdHZ4dGl2YXhtZ25wemFyc2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NzE3NzYsImV4cCI6MjA4MDU0Nzc3Nn0.aR5sosyeS3wDT9x93BLBQ79CiD8dpVYlHMr-G7Ggbbo'
};

// Variabile globale per il client Supabase
var supabase;

// Funzione di inizializzazione
function initializeSupabaseClient() {
    let attempts = 0;
    const maxAttempts = 50;
    
    function tryInit() {
        attempts++;
        console.log(`🔧 Tentativo ${attempts}/${maxAttempts} - Inizializzazione Supabase...`);
        
        // Controlla se window.supabase è disponibile
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            try {
                // Crea il client Supabase
                supabase = window.supabase.createClient(
                    SUPABASE_CONFIG.URL,
                    SUPABASE_CONFIG.ANON_KEY
                );
                
                console.log('✅ Supabase client creato!');
                console.log('✅ Auth disponibile:', !!supabase.auth);
                
                // Mostra stato nella UI
                const authStatus = document.getElementById('authStatus');
                if (authStatus) {
                    authStatus.innerHTML = `
                        <div style="background: #d4edda; color: #155724; padding: 10px; border-radius: 8px;">
                            ✅ Sistema pronto per il login
                        </div>
                    `;
                }
                
                // Inizializza l'autenticazione
                if (typeof initializeAuth === 'function') {
                    console.log('🔐 Avvio autenticazione...');
                    setTimeout(initializeAuth, 100);
                } else {
                    console.log('⏳ initializeAuth non ancora disponibile');
                }
                
                return true;
                
            } catch (error) {
                console.error('❌ Errore creazione client:', error);
                return false;
            }
        }
        
        // Se non è ancora disponibile, riprova
        if (attempts < maxAttempts) {
            setTimeout(tryInit, 100);
        } else {
            console.error('❌ Timeout: Supabase non caricato dopo 5 secondi');
            console.error('❌ Verifica connessione e CDN');
            
            const authStatus = document.getElementById('authStatus');
            if (authStatus) {
                authStatus.innerHTML = `
                    <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px;">
                        <strong>❌ Errore di caricamento</strong><br>
                        La libreria Supabase non si carica.<br>
                        Verifica la connessione internet e ricarica la pagina.
                    </div>
                `;
            }
        }
    }
    
    // Avvia il tentativo
    tryInit();
}

// Avvia quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabaseClient);
} else {
    initializeSupabaseClient();
}

console.log('✅ supabase-config.js caricato');
