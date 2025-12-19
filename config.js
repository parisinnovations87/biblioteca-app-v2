// ========================================
// CONFIGURAZIONE APPLICAZIONE
// ========================================

// Variabili globali dell'app
let books = [];
let userLibraries = [];
let userCategories = [];
let userKeywords = [];
let selectedKeywords = [];

// Scanner
let codeReader = null;
let selectedDeviceId = null;
let scannerActive = false;

// Modalità edit
let isEditMode = false;
let editingBookId = null;

// Configurazione sviluppo
const DEV_MODE = window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1' ||
                 window.location.hostname.includes('netlify');

if (DEV_MODE) {
    console.log('🔧 Modalità sviluppo attiva');
}

console.log('✅ Config caricato');

// NOTA: supabase viene dichiarato e inizializzato in supabase-config.js
// NON dichiararlo qui!
