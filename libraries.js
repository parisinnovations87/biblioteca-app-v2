// ========================================
// GESTIONE LIBRERIE UTENTE - SUPABASE
// ========================================

// Carica le librerie dell'utente
async function loadUserLibraries() {
    if (!currentUser) return;
    
    await loadLibrariesFromSupabase();
    updateLibraryDropdown();
    displayLibraries();
}

// Aggiungi nuova libreria
async function addLibrary() {
    const libraryName = document.getElementById('libraryName').value.trim();
    
    if (!libraryName) {
        showAlert('Inserisci il nome della libreria', 'error');
        return;
    }
    
    // Verifica se esiste già
    if (userLibraries.some(lib => lib.name.toLowerCase() === libraryName.toLowerCase())) {
        showAlert('Questa libreria esiste già', 'error');
        return;
    }
    
    try {
        const libraryId = await saveLibraryToSupabase(libraryName);
        
        // Aggiungi alla lista locale
        userLibraries.push({
            id: libraryId,
            userId: currentUser.id,
            name: libraryName,
            dateCreated: new Date().toLocaleDateString('it-IT')
        });
        
        updateLibraryDropdown();
        displayLibraries();
        
        document.getElementById('libraryName').value = '';
        showAlert('Libreria aggiunta con successo!', 'success');
        
    } catch (error) {
        console.error('❌ Errore aggiunta libreria:', error);
        showAlert('Errore durante l\'aggiunta: ' + error.message, 'error');
    }
}

// Elimina libreria
async function deleteLibrary(libraryName) {
    // Trova la libreria
    const library = userLibraries.find(lib => lib.name === libraryName);
    if (!library) return;
    
    // Controlla se ci sono libri in questa libreria
    const booksInLibrary = books.filter(book => book.shelf === libraryName);
    
    if (booksInLibrary.length > 0) {
        if (!confirm(`Ci sono ${booksInLibrary.length} libri in questa libreria. Eliminandola, dovrai riassegnare i libri. Continuare?`)) {
            return;
        }
    } else {
        if (!confirm(`Sei sicuro di voler eliminare la libreria "${libraryName}"?`)) {
            return;
        }
    }
    
    try {
        await deleteLibraryFromSupabase(library.id);
        
        // Rimuovi dalla lista locale
        userLibraries = userLibraries.filter(lib => lib.id !== library.id);
        
        updateLibraryDropdown();
        displayLibraries();
        
        showAlert('Libreria eliminata', 'success');
        
    } catch (error) {
        console.error('❌ Errore eliminazione libreria:', error);
        showAlert('Errore durante l\'eliminazione: ' + error.message, 'error');
    }
}

// Visualizza librerie
function displayLibraries() {
    const librariesList = document.getElementById('librariesList');
    
    if (!librariesList) return;
    
    if (userLibraries.length === 0) {
        librariesList.innerHTML = `
            <div class="empty-state">
                <div class="icon">📚</div>
                <h3>Nessuna libreria configurata</h3>
                <p>Aggiungi le tue librerie per organizzare al meglio i tuoi libri!</p>
            </div>
        `;
        return;
    }
    
    librariesList.innerHTML = userLibraries.map(library => {
        const booksCount = books.filter(b => b.shelf === library.name).length;
        return `
            <div class="library-card">
                <div class="library-info">
                    <h3>📚 ${library.name}</h3>
                    <p>Aggiunta il: ${library.dateCreated}</p>
                    <p>Libri: ${booksCount}</p>
                </div>
                <button class="delete-btn" onclick="deleteLibrary('${library.name.replace(/'/g, "\\'")}')">Elimina</button>
            </div>
        `;
    }).join('');
}

// Aggiorna dropdown librerie
function updateLibraryDropdown() {
    const shelfSelect = document.getElementById('shelf');
    
    if (!shelfSelect) return;
    
    // Salva il valore corrente
    const currentValue = shelfSelect.value;
    
    // Ricrea le opzioni
    shelfSelect.innerHTML = '<option value="">Seleziona libreria</option>';
    
    userLibraries.forEach(library => {
        const option = document.createElement('option');
        option.value = library.name;
        option.textContent = library.name;
        shelfSelect.appendChild(option);
    });
    
    // Opzione per aggiungere nuova libreria
    const addNewOption = document.createElement('option');
    addNewOption.value = '__ADD_NEW__';
    addNewOption.textContent = '➕ Aggiungi nuova libreria...';
    shelfSelect.appendChild(addNewOption);
    
    // Ripristina il valore se esisteva
    if (currentValue && userLibraries.some(lib => lib.name === currentValue)) {
        shelfSelect.value = currentValue;
    }
    
    console.log('📋 Dropdown librerie aggiornato con', userLibraries.length, 'librerie');
}

// Gestisce la selezione della libreria dal form libro
function handleShelfSelection() {
    const shelfSelect = document.getElementById('shelf');
    
    if (shelfSelect.value === '__ADD_NEW__') {
        const libraryName = prompt('Inserisci il nome della nuova libreria:');
        
        if (libraryName && libraryName.trim()) {
            const trimmedName = libraryName.trim();
            
            // Verifica se esiste già
            if (userLibraries.some(lib => lib.name.toLowerCase() === trimmedName.toLowerCase())) {
                showAlert('Questa libreria esiste già', 'error');
                shelfSelect.value = trimmedName;
                return;
            }
            
            // Aggiungi la nuova libreria
            saveLibraryToSupabase(trimmedName).then(libraryId => {
                userLibraries.push({
                    id: libraryId,
                    userId: currentUser.id,
                    name: trimmedName,
                    dateCreated: new Date().toLocaleDateString('it-IT')
                });
                
                updateLibraryDropdown();
                shelfSelect.value = trimmedName;
                
                showAlert('Libreria aggiunta!', 'success');
            }).catch(error => {
                console.error('❌ Errore aggiunta libreria:', error);
                showAlert('Errore durante l\'aggiunta: ' + error.message, 'error');
                shelfSelect.value = '';
            });
        } else {
            shelfSelect.value = '';
        }
    }
}