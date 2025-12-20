// ========================================
// SISTEMA TOAST NOTIFICATIONS
// ========================================

/**
 * Sistema di notifiche toast professionale
 * 
 * UTILIZZO:
 * showToast('Messaggio qui', 'success'); // success, error, warning, info
 * showToast('Con durata custom', 'info', 10000); // 10 secondi
 * 
 * FEATURES:
 * - 4 tipi: success, error, warning, info
 * - Auto-dismiss configurabile
 * - Chiusura manuale
 * - Stack multipli
 * - Animazioni fluide
 * - Responsive mobile
 */

class ToastNotification {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.maxToasts = 5; // Massimo toast visibili contemporaneamente
        this.init();
    }

    /**
     * Inizializza il container dei toast
     */
    init() {
        // Crea container se non esiste
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
            console.log('✅ Toast container inizializzato');
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    /**
     * Mostra un toast
     * @param {string} message - Messaggio da mostrare
     * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Durata in millisecondi (default: 5000)
     * @returns {string} ID del toast creato
     */
    show(message, type = 'info', duration = 5000) {
        // Validazione tipo
        const validTypes = ['success', 'error', 'warning', 'info'];
        if (!validTypes.includes(type)) {
            console.warn(`Tipo toast invalido: ${type}. Uso 'info' come default.`);
            type = 'info';
        }

        // Crea ID unico per il toast
        const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Rimuovi toast vecchi se siamo al limite
        if (this.toasts.length >= this.maxToasts) {
            const oldestToast = this.toasts[0];
            this.remove(oldestToast.id);
        }

        // Crea elemento toast
        const toast = this.createToastElement(toastId, message, type);

        // Aggiungi al container (in cima allo stack)
        this.container.insertBefore(toast, this.container.firstChild);

        // Salva riferimento
        this.toasts.push({
            id: toastId,
            element: toast,
            timeout: null
        });

        // Anima entrata dopo un breve delay (per trigger CSS transition)
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 10);

        // Setup auto-dismiss
        if (duration > 0) {
            const toastObj = this.toasts.find(t => t.id === toastId);
            toastObj.timeout = setTimeout(() => {
                this.remove(toastId);
            }, duration);
        }

        return toastId;
    }

    /**
     * Crea l'elemento HTML del toast
     */
    createToastElement(id, message, type) {
        const toast = document.createElement('div');
        toast.id = id;
        toast.className = `toast toast-${type}`;

        // Icone per tipo
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-message">${this.escapeHtml(message)}</div>
            <button class="toast-close" onclick="toastSystem.remove('${id}')" aria-label="Chiudi notifica">
                ×
            </button>
        `;

        // Event listener per hover (pausa auto-dismiss)
        toast.addEventListener('mouseenter', () => {
            const toastObj = this.toasts.find(t => t.id === id);
            if (toastObj && toastObj.timeout) {
                clearTimeout(toastObj.timeout);
                toastObj.timeout = null;
            }
        });

        // Riprendi countdown quando mouse esce
        toast.addEventListener('mouseleave', () => {
            const toastObj = this.toasts.find(t => t.id === id);
            if (toastObj && !toastObj.timeout) {
                toastObj.timeout = setTimeout(() => {
                    this.remove(id);
                }, 2000); // 2 secondi dopo aver tolto mouse
            }
        });

        return toast;
    }

    /**
     * Rimuove un toast
     */
    remove(toastId) {
        const toastObj = this.toasts.find(t => t.id === toastId);
        if (!toastObj) return;

        // Cancella timeout se esiste
        if (toastObj.timeout) {
            clearTimeout(toastObj.timeout);
        }

        // Anima uscita
        toastObj.element.classList.remove('toast-show');
        toastObj.element.classList.add('toast-hide');

        // Rimuovi dal DOM dopo animazione
        setTimeout(() => {
            if (toastObj.element.parentNode) {
                toastObj.element.parentNode.removeChild(toastObj.element);
            }
            // Rimuovi da array
            this.toasts = this.toasts.filter(t => t.id !== toastId);
        }, 300); // Durata animazione CSS
    }

    /**
     * Rimuove tutti i toast
     */
    removeAll() {
        this.toasts.forEach(toast => {
            this.remove(toast.id);
        });
    }

    /**
     * Escape HTML per prevenire XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Shortcut methods per tipi comuni
     */
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// ========================================
// INIZIALIZZAZIONE GLOBALE
// ========================================

// Crea istanza globale
let toastSystem;

// Inizializza quando DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        toastSystem = new ToastNotification();
        console.log('✅ Sistema Toast inizializzato');
    });
} else {
    toastSystem = new ToastNotification();
    console.log('✅ Sistema Toast inizializzato');
}

// ========================================
// FUNZIONE HELPER GLOBALE (COMPATIBILITÀ)
// ========================================

/**
 * Funzione helper per mostrare toast
 * Sostituisce showAlert() nel codice esistente
 * 
 * @param {string} message - Messaggio da mostrare
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Durata in ms (default: 5000)
 */
function showToast(message, type = 'info', duration = 5000) {
    if (!toastSystem) {
        console.error('❌ Sistema toast non inizializzato');
        // Fallback a console
        console.log(`[TOAST ${type.toUpperCase()}]: ${message}`);
        return null;
    }
    return toastSystem.show(message, type, duration);
}

// Alias per compatibilità con codice esistente
function showAlert(message, type) {
    // Mappa i vecchi tipi ai nuovi
    const typeMap = {
        'success': 'success',
        'error': 'error',
        'warning': 'warning',
        'info': 'info'
    };
    
    const mappedType = typeMap[type] || 'info';
    return showToast(message, mappedType);
}

// ========================================
// ESEMPI DI UTILIZZO
// ========================================

/**
 * UTILIZZO BASE:
 * 
 * showToast('Libro aggiunto con successo!', 'success');
 * showToast('Errore durante il salvataggio', 'error');
 * showToast('Limite libri quasi raggiunto', 'warning');
 * showToast('Scanner fotocamera avviato', 'info');
 * 
 * CON DURATA CUSTOM:
 * 
 * showToast('Questo resta 10 secondi', 'info', 10000);
 * showToast('Questo resta per sempre', 'warning', 0);
 * 
 * SHORTCUT METHODS:
 * 
 * toastSystem.success('Operazione completata!');
 * toastSystem.error('Qualcosa è andato storto');
 * toastSystem.warning('Attenzione!');
 * toastSystem.info('Informazione utile');
 * 
 * RIMOZIONE MANUALE:
 * 
 * const toastId = showToast('Messaggio', 'info');
 * setTimeout(() => {
 *     toastSystem.remove(toastId);
 * }, 2000);
 * 
 * RIMUOVI TUTTI:
 * 
 * toastSystem.removeAll();
 */

console.log('📦 toast-system.js caricato');
