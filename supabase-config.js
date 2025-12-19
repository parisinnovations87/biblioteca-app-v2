// ========================================
// CONFIGURAZIONE SUPABASE - FIX COMPLETO
// ========================================

// 🔧 CONFIGURA QUESTE VARIABILI CON I TUOI DATI SUPABASE
const SUPABASE_CONFIG = {
    URL: 'https://uotvxtivaxmgnpzarsda.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvdHZ4dGl2YXhtZ25wemFyc2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NzE3NzYsImV4cCI6MjA4MDU0Nzc3Nn0.aR5sosyeS3wDT9x93BLBQ79CiD8dpVYlHMr-G7Ggbbo'
};

// Dichiara supabase come variabile globale
let supabase;
let supabaseInitAttempts = 0;
const MAX_INIT_ATTEMPTS = 50; // 5 secondi massimo

function initializeSupabase() {
    console.log('🔧 Tentativo inizializzazione Supabase...', supabaseInitAttempts + 1);
    
    // Verifica se window.supabase esiste
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
        supabaseInitAttempts++;
        
        if (supabaseInitAttempts < MAX_INIT_ATTEMPTS) {
            console.log('⏳ Supabase non ancora caricato, riprovo...');
            setTimeout(initializeSupabase, 100);
            return;
        } else {
            console.error('❌ ERRORE: Libreria Supabase non caricata dopo 5 secondi!');
            console.error('❌ Verifica che il CDN sia raggiungibile:');
            console.error('❌ https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
            
            // Mostra alert all'utente
            if (document.getElementById('authStatus')) {
                document.getElementById('authStatus').innerHTML = `
                    <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <strong>❌ Errore di caricamento</strong><br>
                        La libreria Supabase non si carica. Possibili cause:<br>
                        • Problema di connessione internet<br>
                        • CDN bloccato<br>
                        • AdBlocker attivo<br><br>
                        Prova a ricaricare la pagina o disattivare AdBlock.
                    </div>
                `;
            }
            return;
        }
    }
    
    // Supabase è caricato, inizializzalo
    try {
        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.URL,
            SUPABASE_CONFIG.ANON_KEY
        );
        
        console.log('✅ Supabase inizializzato correttamente!');
        console.log('📊 Supabase client:', supabase ? 'OK' : 'ERRORE');
        
        // Verifica che auth sia disponibile
        if (supabase.auth) {
            console.log('✅ Supabase Auth disponibile');
        } else {
            console.error('❌ Supabase Auth NON disponibile!');
        }
        
        // Mostra stato OK
        if (document.getElementById('authStatus')) {
            document.getElementById('authStatus').innerHTML = `
                <div style="background: #d4edda; color: #155724; padding: 10px; border-radius: 8px;">
                    ✅ Sistema pronto - Puoi effettuare il login
                </div>
            `;
        }
        
        // Inizializza l'autenticazione
        if (typeof initializeAuth === 'function') {
            console.log('🔐 Inizializzazione autenticazione...');
            initializeAuth();
        }
        
    } catch (error) {
        console.error('❌ Errore creazione client Supabase:', error);
        console.error('📋 Config:', SUPABASE_CONFIG);
    }
}

// Avvia l'inizializzazione quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
    // DOM già caricato
    initializeSupabase();
}

console.log('📦 supabase-config.js caricato');
