// ========================================
// AUTENTICAZIONE CON SUPABASE
// ========================================

let currentUser = null;
let isInitialized = false;

// Inizializza autenticazione
async function initializeAuth() {
    console.log('🔐 Inizializzazione autenticazione...');
    
    try {
        // Controlla se c'è già una sessione attiva
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('❌ Errore recupero sessione:', error);
            return;
        }
        
        if (session?.user) {
            console.log('✅ Sessione trovata:', session.user.email);
            await handleAuthSuccess(session.user);
            isInitialized = true;
        } else {
            console.log('ℹ️ Nessuna sessione attiva');
        }
        
        // Ascolta i cambiamenti di autenticazione
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔄 Auth event:', event);
            
            if (event === 'TOKEN_REFRESHED') {
                console.log('🔄 Token refreshato automaticamente');
                // Non ricaricare i dati quando il token viene refreshato
                return;
            }
            
            if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
                handleSignOut();
                isInitialized = false;
                return;
            }
            
            if (event === 'INITIAL_SESSION' && session?.user && !isInitialized) {
                // Solo al primo caricamento
                await handleAuthSuccess(session.user);
                isInitialized = true;
                return;
            }
            
            // Ignora tutti gli altri eventi SIGNED_IN per evitare ricaricamenti continui
            if (event === 'SIGNED_IN') {
                console.log('ℹ️ Evento SIGNED_IN ignorato (già inizializzato)');
            }
        });
        
    } catch (error) {
        console.error('❌ Errore inizializzazione auth:', error);
    }
}

// Login con Google
async function signInWithGoogle() {
    try {
        console.log('🔐 Avvio login Google...');
        setLoginLoading(true);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: 'https://biblioteca-app-v2.netlify.app'
            }
        });
        
        if (error) {
            throw error;
        }
        
        // Il redirect avverrà automaticamente
        console.log('✅ Redirect a Google...');
        
    } catch (error) {
        console.error('❌ Errore login:', error);
        showAlert('Errore durante il login: ' + error.message, 'error');
        setLoginLoading(false);
    }
}

// Gestisce login riuscito
async function handleAuthSuccess(user) {
    console.log('✅ Login riuscito:', user.email);
    
    // Crea o aggiorna profilo utente
    await createOrUpdateUserProfile(user);
    
    // Imposta utente corrente
    currentUser = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        avatar: user.user_metadata?.avatar_url || generateAvatarUrl(user.email),
        authMethod: 'google'
    };
    
    setLoginLoading(false);
    showApp();
    
    // Carica i dati SOLO se non sono già stati caricati
    if (!isInitialized) {
        await loadAllUserData();
    }
    
    showAlert(`Benvenuto ${currentUser.name}!`, 'success');
}

// Crea o aggiorna profilo utente
async function createOrUpdateUserProfile(user) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .upsert({
                id: user.id,
                full_name: user.user_metadata?.full_name || user.email.split('@')[0],
                avatar_url: user.user_metadata?.avatar_url,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error && error.code !== '23505') { // Ignora errore duplicate key
            console.error('⚠️ Errore creazione profilo:', error);
        } else {
            console.log('✅ Profilo utente sincronizzato');
        }
    } catch (error) {
        console.error('❌ Errore profilo:', error);
    }
}

// Logout
async function signOut() {
    if (!confirm('Sei sicuro di voler uscire?')) {
        return;
    }
    
    try {
        // Ferma lo scanner se attivo
        if (typeof scannerActive !== 'undefined' && scannerActive) {
            stopScanner();
        }
        
        // Prova il logout, ma continua anche se fallisce
        try {
            await supabase.auth.signOut();
        } catch (logoutError) {
            console.warn('⚠️ Errore durante signOut (ignorato):', logoutError);
        }
        
        // Pulisci sempre i dati locali, anche se il logout ha dato errore
        handleSignOut();
        showAlert('Logout effettuato con successo', 'info');
        
    } catch (error) {
        console.error('❌ Errore logout:', error);
        // Anche in caso di errore, pulisci i dati locali
        handleSignOut();
        showAlert('Logout locale effettuato', 'info');
    }
}

// Gestisce logout
function handleSignOut() {
    currentUser = null;
    books = [];
    userLibraries = [];
    userCategories = [];
    userKeywords = [];
    isInitialized = false;
    
    hideApp();
    clearForm();
}

// Genera avatar URL
function generateAvatarUrl(email) {
    const initial = email.charAt(0).toUpperCase();
    const colors = ['4285f4', '34a853', 'fbbc05', 'ea4335', '9c27b0', '00bcd4'];
    const colorIndex = email.length % colors.length;
    return `https://ui-avatars.com/api/?name=${initial}&background=${colors[colorIndex]}&color=fff&size=128`;
}

// Mostra/Nascondi app
function showApp() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('appSection').classList.remove('hidden');
    
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userAvatar').src = currentUser.avatar;
    
    const authMethod = document.getElementById('authMethod');
    if (authMethod) {
        authMethod.textContent = '🔐 Account Google';
    }
}

function hideApp() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('appSection').classList.add('hidden');
}

// Loading state
function setLoginLoading(loading) {
    const loginBtn = document.getElementById('googleSignInBtn');
    const loginLoading = document.getElementById('loginLoading');
    
    if (loading) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (loginLoading) loginLoading.classList.remove('hidden');
    } else {
        if (loginBtn) loginBtn.style.display = 'flex';
        if (loginLoading) loginLoading.classList.add('hidden');
    }
}

// Carica tutti i dati utente
async function loadAllUserData() {
    console.log('📥 Caricamento dati utente...');
    
    await Promise.all([
        loadUserLibraries(),
        loadUserCategories(),
        loadUserKeywords()
    ]);
    
    await loadBooks();
    
    console.log('✅ Dati caricati');
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 Biblioteca Domestica - Inizializzazione...');
    initializeAuth();
});
