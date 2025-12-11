// ========================================
// GESTIONE CATEGORIE UTENTE - SUPABASE
// ========================================

// Carica le categorie dell'utente
async function loadUserCategories() {
    if (!currentUser) return;
    
    await loadCategoriesFromSupabase();
    updateCategoryDropdown();
    displayCategories();
}

// Aggiungi nuova categoria
async function addCategory() {
    const categoryName = document.getElementById('categoryName').value.trim();
    
    if (!categoryName) {
        showAlert('Inserisci il nome della categoria', 'error');
        return;
    }
    
    // Verifica se esiste già
    if (userCategories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
        showAlert('Questa categoria esiste già', 'error');
        return;
    }
    
    try {
        const categoryId = await saveCategoryToSupabase(categoryName);
        
        // Aggiungi alla lista locale
        userCategories.push({
            id: categoryId,
            userId: currentUser.id,
            name: categoryName,
            dateCreated: new Date().toLocaleDateString('it-IT')
        });
        
        updateCategoryDropdown();
        displayCategories();
        
        document.getElementById('categoryName').value = '';
        showAlert('Categoria aggiunta con successo!', 'success');
        
    } catch (error) {
        console.error('❌ Errore aggiunta categoria:', error);
        showAlert('Errore durante l\'aggiunta: ' + error.message, 'error');
    }
}

// Elimina categoria
async function deleteCategory(categoryName) {
    console.log('🔵 deleteCategory chiamata per:', categoryName);
    console.log('🔵 Lista categorie corrente:', userCategories);
    
    // Trova la categoria
    const category = userCategories.find(cat => cat.name === categoryName);
    
    console.log('🔵 Categoria trovata:', category);
    
    if (!category) {
        console.error('❌ Categoria non trovata:', categoryName);
        showAlert('Categoria non trovata', 'error');
        return;
    }
    
    // Controlla se ci sono libri in questa categoria
    const booksInCategory = books.filter(book => book.genre === categoryName);
    
    console.log('🔵 Libri in questa categoria:', booksInCategory.length);
    
    let confirmMessage = '';
    if (booksInCategory.length > 0) {
        confirmMessage = `Ci sono ${booksInCategory.length} libri in questa categoria.\n\nEliminandola, i libri rimarranno senza categoria.\n\nContinuare?`;
    } else {
        confirmMessage = `Sei sicuro di voler eliminare la categoria "${categoryName}"?`;
    }
    
    const confirmed = confirm(confirmMessage);
    console.log('🔵 Utente ha confermato:', confirmed);
    
    if (!confirmed) {
        console.log('🔵 Cancellazione annullata dall\'utente');
        return;
    }
    
    try {
        console.log('🗑️ Tentativo eliminazione categoria:', categoryName, 'ID:', category.id);
        
        // Elimina da Supabase
        await deleteCategoryFromSupabase(category.id);
        
        console.log('✅ Eliminazione da Supabase completata');
        
        // Rimuovi dalla lista locale
        userCategories = userCategories.filter(cat => cat.id !== category.id);
        
        console.log('✅ Rimossa dalla lista locale');
        
        // Aggiorna i libri locali
        books.forEach(book => {
            if (book.genre === categoryName) {
                book.genre = '';
                book.categoryId = null;
            }
        });
        
        console.log('✅ Libri aggiornati');
        
        updateCategoryDropdown();
        displayCategories();
        displayBooks();
        
        console.log('✅ UI aggiornata');
        
        showAlert('Categoria eliminata con successo', 'success');
        
    } catch (error) {
        console.error('❌ ERRORE eliminazione categoria:', error);
        console.error('❌ Stack trace:', error.stack);
        showAlert('Errore durante l\'eliminazione: ' + error.message, 'error');
    }
}

// Visualizza categorie
function displayCategories() {
    const categoriesList = document.getElementById('categoriesList');
    
    if (!categoriesList) return;
    
    if (userCategories.length === 0) {
        categoriesList.innerHTML = `
            <div class="empty-state">
                <div class="icon">📚</div>
                <h3>Nessuna categoria configurata</h3>
                <p>Aggiungi le tue categorie personalizzate!</p>
            </div>
        `;
        return;
    }
    
    categoriesList.innerHTML = userCategories.map(category => {
        const booksCount = books.filter(b => b.genre === category.name).length;
        return `
            <div class="library-card">
                <div class="library-info">
                    <h3>📚 ${category.name}</h3>
                    <p>Aggiunta il: ${category.dateCreated}</p>
                    <p>Libri: ${booksCount}</p>
                </div>
                <button class="delete-btn" onclick="deleteCategory('${category.name.replace(/'/g, "\\'")}')">Elimina</button>
            </div>
        `;
    }).join('');
}

// Aggiorna dropdown categoria
function updateCategoryDropdown() {
    const genreSelect = document.getElementById('genre');
    
    if (!genreSelect) return;
    
    // Salva il valore corrente
    const currentValue = genreSelect.value;
    
    // Ricrea le opzioni
    genreSelect.innerHTML = '<option value="">Seleziona categoria</option>';
    
    userCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        genreSelect.appendChild(option);
    });
    
    // Opzione per aggiungere nuova categoria
    const addNewOption = document.createElement('option');
    addNewOption.value = '__ADD_NEW__';
    addNewOption.textContent = '➕ Aggiungi nuova categoria...';
    genreSelect.appendChild(addNewOption);
    
    // Ripristina il valore se esisteva
    if (currentValue && userCategories.some(cat => cat.name === currentValue)) {
        genreSelect.value = currentValue;
    }
    
    console.log('📋 Dropdown categorie aggiornato con', userCategories.length, 'categorie');
}

// Gestisce selezione categoria dal form libro
function handleCategorySelection() {
    const genreSelect = document.getElementById('genre');
    
    if (genreSelect.value === '__ADD_NEW__') {
        const categoryName = prompt('Inserisci il nome della nuova categoria:');
        
        if (categoryName && categoryName.trim()) {
            const trimmedName = categoryName.trim();
            
            // Verifica se esiste già
            if (userCategories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
                showAlert('Questa categoria esiste già', 'error');
                genreSelect.value = trimmedName;
                return;
            }
            
            // Aggiungi la nuova categoria
            saveCategoryToSupabase(trimmedName).then(categoryId => {
                userCategories.push({
                    id: categoryId,
                    userId: currentUser.id,
                    name: trimmedName,
                    dateCreated: new Date().toLocaleDateString('it-IT')
                });
                
                updateCategoryDropdown();
                genreSelect.value = trimmedName;
                
                showAlert('Categoria aggiunta!', 'success');
            }).catch(error => {
                console.error('❌ Errore aggiunta categoria:', error);
                showAlert('Errore durante l\'aggiunta: ' + error.message, 'error');
                genreSelect.value = '';
            });
        } else {
            genreSelect.value = '';
        }
    }
}
