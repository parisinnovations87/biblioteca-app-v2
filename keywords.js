// ========================================
// GESTIONE PAROLE CHIAVE UTENTE - SUPABASE
// ========================================

// Carica le parole chiave dell'utente
async function loadUserKeywords() {
    if (!currentUser) return;
    
    await loadKeywordsFromSupabase();
    updateKeywordDropdown();
    displayKeywords();
}

// Aggiungi nuova parola chiave
async function addKeyword() {
    const keywordName = document.getElementById('keywordName').value.trim();
    
    if (!keywordName) {
        showAlert('Inserisci la parola chiave', 'error');
        return;
    }
    
    // Verifica se esiste già
    if (userKeywords.some(kw => kw.name.toLowerCase() === keywordName.toLowerCase())) {
        showAlert('Questa parola chiave esiste già', 'error');
        return;
    }
    
    try {
        const keywordId = await saveKeywordToSupabase(keywordName);
        
        // Aggiungi alla lista locale
        userKeywords.push({
            id: keywordId,
            userId: currentUser.id,
            name: keywordName,
            dateCreated: new Date().toLocaleDateString('it-IT')
        });
        
        updateKeywordDropdown();
        displayKeywords();
        
        document.getElementById('keywordName').value = '';
        showAlert('Parola chiave aggiunta con successo!', 'success');
        
    } catch (error) {
        console.error('❌ Errore aggiunta parola chiave:', error);
        showAlert('Errore durante l\'aggiunta: ' + error.message, 'error');
    }
}

// Elimina parola chiave
async function deleteKeyword(keywordName) {
    console.log('🔵 deleteKeyword chiamata per:', keywordName);
    console.log('🔵 Lista parole chiave corrente:', userKeywords);
    
    // Trova la parola chiave
    const keyword = userKeywords.find(kw => kw.name === keywordName);
    
    console.log('🔵 Parola chiave trovata:', keyword);
    
    if (!keyword) {
        console.error('❌ Parola chiave non trovata:', keywordName);
        showAlert('Parola chiave non trovata', 'error');
        return;
    }
    
    // Controlla se ci sono libri con questa parola chiave
    const booksWithKeyword = books.filter(book => 
        book.keywords && book.keywords.split(', ').includes(keywordName)
    );
    
    console.log('🔵 Libri con questa parola chiave:', booksWithKeyword.length);
    
    let confirmMessage = '';
    if (booksWithKeyword.length > 0) {
        confirmMessage = `Ci sono ${booksWithKeyword.length} libri con questa parola chiave.\n\nEliminandola, verrà rimossa dai libri.\n\nContinuare?`;
    } else {
        confirmMessage = `Sei sicuro di voler eliminare la parola chiave "${keywordName}"?`;
    }
    
    const confirmed = confirm(confirmMessage);
    console.log('🔵 Utente ha confermato:', confirmed);
    
    if (!confirmed) {
        console.log('🔵 Cancellazione annullata dall\'utente');
        return;
    }
    
    try {
        console.log('🗑️ Tentativo eliminazione parola chiave:', keywordName, 'ID:', keyword.id);
        
        // Elimina da Supabase
        await deleteKeywordFromSupabase(keyword.id);
        
        console.log('✅ Eliminazione da Supabase completata');
        
        // Rimuovi dalla lista locale
        userKeywords = userKeywords.filter(kw => kw.id !== keyword.id);
        
        console.log('✅ Rimossa dalla lista locale');
        
        // Aggiorna i libri locali
        books.forEach(book => {
            if (book.keywords) {
                const keywords = book.keywords.split(', ').filter(k => k !== keywordName);
                book.keywords = keywords.join(', ');
            }
        });
        
        console.log('✅ Libri aggiornati');
        
        updateKeywordDropdown();
        displayKeywords();
        displayBooks();
        
        console.log('✅ UI aggiornata');
        
        showAlert('Parola chiave eliminata con successo', 'success');
        
    } catch (error) {
        console.error('❌ ERRORE eliminazione parola chiave:', error);
        console.error('❌ Stack trace:', error.stack);
        showAlert('Errore durante l\'eliminazione: ' + error.message, 'error');
    }
}

// Visualizza parole chiave
function displayKeywords() {
    const keywordsList = document.getElementById('keywordsList');
    
    if (!keywordsList) return;
    
    if (userKeywords.length === 0) {
        keywordsList.innerHTML = `
            <div class="empty-state">
                <div class="icon">🔖</div>
                <h3>Nessuna parola chiave configurata</h3>
                <p>Aggiungi le tue parole chiave personalizzate!</p>
            </div>
        `;
        return;
    }
    
    keywordsList.innerHTML = userKeywords.map(keyword => {
        const booksCount = books.filter(b => 
            b.keywords && b.keywords.split(', ').includes(keyword.name)
        ).length;
        return `
            <div class="library-card">
                <div class="library-info">
                    <h3>🔖 ${keyword.name}</h3>
                    <p>Aggiunta il: ${keyword.dateCreated}</p>
                    <p>Libri: ${booksCount}</p>
                </div>
                <button class="delete-btn" onclick="deleteKeyword('${keyword.name.replace(/'/g, "\\'")}')">Elimina</button>
            </div>
        `;
    }).join('');
}

// Aggiorna dropdown parole chiave
function updateKeywordDropdown() {
    const keywordsSelect = document.getElementById('keywords');
    
    if (!keywordsSelect) return;
    
    // Salva le parole chiave selezionate
    const currentSelected = getSelectedKeywordsArray();
    
    // Ricrea le opzioni
    keywordsSelect.innerHTML = '<option value="">Nessuna parola chiave selezionata</option>';
    
    userKeywords.forEach(keyword => {
        const option = document.createElement('option');
        option.value = keyword.name;
        option.textContent = keyword.name;
        keywordsSelect.appendChild(option);
    });
    
    // Opzione per aggiungere nuova parola chiave
    const addNewOption = document.createElement('option');
    addNewOption.value = '__ADD_NEW__';
    addNewOption.textContent = '➕ Aggiungi nuova parola chiave...';
    keywordsSelect.appendChild(addNewOption);
    
    // Ripristina selezioni
    if (currentSelected.length > 0) {
        setSelectedKeywordsArray(currentSelected);
    }
    
    console.log('📋 Dropdown parole chiave aggiornato con', userKeywords.length, 'parole chiave');
}

// Gestisce selezione parola chiave dal dropdown
function handleKeywordSelection() {
    const keywordsSelect = document.getElementById('keywords');
    const selectedValue = keywordsSelect.value;
    
    if (selectedValue === '__ADD_NEW__') {
        const keywordName = prompt('Inserisci la nuova parola chiave:');
        
        if (keywordName && keywordName.trim()) {
            const trimmedName = keywordName.trim();
            
            // Verifica se esiste già
            if (userKeywords.some(kw => kw.name.toLowerCase() === trimmedName.toLowerCase())) {
                showAlert('Questa parola chiave esiste già', 'error');
                keywordsSelect.value = '';
                return;
            }
            
            // Aggiungi la nuova parola chiave
            saveKeywordToSupabase(trimmedName).then(keywordId => {
                userKeywords.push({
                    id: keywordId,
                    userId: currentUser.id,
                    name: trimmedName,
                    dateCreated: new Date().toLocaleDateString('it-IT')
                });
                
                updateKeywordDropdown();
                addKeywordToSelection(trimmedName);
                
                showAlert('Parola chiave aggiunta!', 'success');
            }).catch(error => {
                console.error('❌ Errore aggiunta parola chiave:', error);
                showAlert('Errore durante l\'aggiunta: ' + error.message, 'error');
            });
        }
        
        keywordsSelect.value = '';
        return;
    }
    
    if (selectedValue && selectedValue !== '') {
        addKeywordToSelection(selectedValue);
        keywordsSelect.value = '';
    }
}

// Aggiungi parola chiave alla selezione
function addKeywordToSelection(keywordName) {
    const selectedKeywordsDiv = document.getElementById('selectedKeywords');
    
    // Verifica se è già selezionata
    const existingTag = selectedKeywordsDiv.querySelector(`[data-keyword="${keywordName}"]`);
    if (existingTag) {
        showAlert('Questa parola chiave è già selezionata', 'info');
        return;
    }
    
    // Crea il tag
    const tag = document.createElement('span');
    tag.className = 'keyword-tag';
    tag.setAttribute('data-keyword', keywordName);
    tag.innerHTML = `
        ${keywordName}
        <button type="button" onclick="removeKeywordFromSelection('${keywordName.replace(/'/g, "\\'")}')">×</button>
    `;
    
    selectedKeywordsDiv.appendChild(tag);
}

// Rimuovi parola chiave dalla selezione
function removeKeywordFromSelection(keywordName) {
    const selectedKeywordsDiv = document.getElementById('selectedKeywords');
    const tag = selectedKeywordsDiv.querySelector(`[data-keyword="${keywordName}"]`);
    if (tag) {
        tag.remove();
    }
}

// Ottieni array delle parole chiave selezionate
function getSelectedKeywordsArray() {
    const selectedKeywordsDiv = document.getElementById('selectedKeywords');
    if (!selectedKeywordsDiv) return [];
    
    const tags = selectedKeywordsDiv.querySelectorAll('.keyword-tag');
    return Array.from(tags).map(tag => tag.getAttribute('data-keyword'));
}

// Imposta array delle parole chiave selezionate
function setSelectedKeywordsArray(keywords) {
    const selectedKeywordsDiv = document.getElementById('selectedKeywords');
    if (!selectedKeywordsDiv) return;
    
    selectedKeywordsDiv.innerHTML = '';
    
    keywords.forEach(keyword => {
        if (userKeywords.some(kw => kw.name === keyword)) {
            addKeywordToSelection(keyword);
        }
    });
}

// Ottieni stringa delle parole chiave selezionate (per salvataggio)
function getSelectedKeywords() {
    return getSelectedKeywordsArray().join(', ');
}

// Imposta parole chiave selezionate da stringa (per modifica)
function setSelectedKeywords(keywordsString) {
    const keywords = keywordsString ? keywordsString.split(', ').map(k => k.trim()).filter(k => k) : [];
    setSelectedKeywordsArray(keywords);
}
