// ========================================
// OPERAZIONI DATABASE SUPABASE
// ========================================

// Gestione errori sessione
function handleSessionError(error) {
    if (error.message?.includes('session') || 
        error.message?.includes('JWT') || 
        error.message?.includes('expired') ||
        error.code === 'PGRST301') {
        console.error('❌ Sessione invalida, logout forzato');
        setTimeout(() => signOut(), 100);
        return true;
    }
    return false;
}

// ==================== LIBRI ====================

// Carica tutti i libri dell'utente
async function loadBooksFromSupabase() {
    try {
        console.log('📚 Caricamento libri...');
        
        const { data, error } = await supabase
            .from('books')
            .select(`
                *,
                category:categories(id, name),
                library:libraries(id, name),
                book_keywords(keyword:keywords(id, name))
            `)
            .order('created_at', { ascending: false });
        
        if (error) {
            if (handleSessionError(error)) return;
            throw error;
        }
        
        // Trasforma i dati nel formato dell'app
        books = data.map(book => ({
            id: book.id.toString(),
            title: book.title,
            author: book.author || '',
            isbn: book.isbn || '',
            publisher: book.publisher || '',
            year: book.year || '',
            genre: book.category?.name || '',
            keywords: book.book_keywords.map(bk => bk.keyword.name).join(', '),
            shelf: book.library?.name || '',
            position: book.position || '',
            condition: book.condition || '',
            notes: book.notes || '',
            addedDate: new Date(book.created_at).toLocaleDateString('it-IT'),
            userId: book.user_id,
            categoryId: book.category_id,
            libraryId: book.library_id
        }));
        
        console.log(`✅ Caricati ${books.length} libri`);
        displayBooks();
        updateBookCount();
        
    } catch (error) {
        console.error('❌ Errore caricamento libri:', error);
        showAlert('Errore caricamento libri: ' + error.message, 'error');
        books = [];
    }
}

// Salva nuovo libro
async function saveBookToSupabase(bookData) {
    try {
        console.log('💾 Salvataggio libro...');
        
        // 1. Inserisci il libro
        const { data: book, error: bookError } = await supabase
            .from('books')
            .insert({
                user_id: currentUser.id,
                title: bookData.title,
                author: bookData.author || null,
                isbn: bookData.isbn || null,
                publisher: bookData.publisher || null,
                year: bookData.year ? parseInt(bookData.year) : null,
                category_id: bookData.categoryId || null,
                library_id: bookData.libraryId || null,
                position: bookData.position || null,
                condition: bookData.condition || null,
                notes: bookData.notes || null
            })
            .select()
            .single();
        
        if (bookError) {
            if (handleSessionError(bookError)) return;
            throw bookError;
        }
        
        // 2. Aggiungi le parole chiave se presenti
        if (bookData.keywordIds && bookData.keywordIds.length > 0) {
            const bookKeywords = bookData.keywordIds.map(kwId => ({
                book_id: book.id,
                keyword_id: kwId
            }));
            
            const { error: kwError } = await supabase
                .from('book_keywords')
                .insert(bookKeywords);
            
            if (kwError) {
                console.error('⚠️ Errore parole chiave:', kwError);
            }
        }
        
        console.log('✅ Libro salvato:', book.id);
        return book.id;
        
    } catch (error) {
        console.error('❌ Errore salvataggio libro:', error);
        throw error;
    }
}

// Aggiorna libro esistente
async function updateBookInSupabase(bookId, bookData) {
    try {
        console.log('🔄 Aggiornamento libro:', bookId);
        
        // 1. Aggiorna il libro
        const { error: bookError } = await supabase
            .from('books')
            .update({
                title: bookData.title,
                author: bookData.author || null,
                isbn: bookData.isbn || null,
                publisher: bookData.publisher || null,
                year: bookData.year ? parseInt(bookData.year) : null,
                category_id: bookData.categoryId || null,
                library_id: bookData.libraryId || null,
                position: bookData.position || null,
                condition: bookData.condition || null,
                notes: bookData.notes || null
            })
            .eq('id', bookId);
        
        if (bookError) {
            if (handleSessionError(bookError)) return;
            throw bookError;
        }
        
        // 2. Aggiorna le parole chiave
        // Prima elimina le vecchie
        const { error: deleteError } = await supabase
            .from('book_keywords')
            .delete()
            .eq('book_id', bookId);
        
        if (deleteError) {
            console.warn('⚠️ Errore eliminazione vecchie parole chiave:', deleteError);
        }
        
        // Poi aggiungi le nuove
        if (bookData.keywordIds && bookData.keywordIds.length > 0) {
            const bookKeywords = bookData.keywordIds.map(kwId => ({
                book_id: bookId,
                keyword_id: kwId
            }));
            
            const { error: insertError } = await supabase
                .from('book_keywords')
                .insert(bookKeywords);
            
            if (insertError) {
                console.warn('⚠️ Errore inserimento nuove parole chiave:', insertError);
            }
        }
        
        console.log('✅ Libro aggiornato');
        
    } catch (error) {
        console.error('❌ Errore aggiornamento libro:', error);
        throw error;
    }
}

// Elimina libro
async function deleteBookFromSupabase(bookId) {
    try {
        console.log('🗑️ Eliminazione libro:', bookId);
        
        const { error } = await supabase
            .from('books')
            .delete()
            .eq('id', bookId);
        
        if (error) {
            if (handleSessionError(error)) return;
            throw error;
        }
        
        console.log('✅ Libro eliminato');
        
    } catch (error) {
        console.error('❌ Errore eliminazione libro:', error);
        throw error;
    }
}

// ==================== CATEGORIE ====================

// Carica categorie
async function loadCategoriesFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
        
        if (error) {
            if (handleSessionError(error)) return;
            throw error;
        }
        
        userCategories = data.map(cat => ({
            id: cat.id,
            userId: cat.user_id,
            name: cat.name,
            dateCreated: new Date(cat.created_at).toLocaleDateString('it-IT')
        }));
        
        console.log(`✅ Caricate ${userCategories.length} categorie`);
        
    } catch (error) {
        console.error('❌ Errore caricamento categorie:', error);
        userCategories = [];
    }
}

// Salva categoria
async function saveCategoryToSupabase(categoryName) {
    try {
        const { data, error } = await supabase
            .from('categories')
            .insert({
                user_id: currentUser.id,
                name: categoryName
            })
            .select()
            .single();
        
        if (error) {
            if (handleSessionError(error)) return;
            throw error;
        }
        
        console.log('✅ Categoria salvata:', data.id);
        return data.id;
        
    } catch (error) {
        console.error('❌ Errore salvataggio categoria:', error);
        throw error;
    }
}

// Elimina categoria
async function deleteCategoryFromSupabase(categoryId) {
    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId);
        
        if (error) {
            if (handleSessionError(error)) return;
            throw error;
        }
        
        console.log('✅ Categoria eliminata');
        
    } catch (error) {
        console.error('❌ Errore eliminazione categoria:', error);
        throw error;
    }
}

// ==================== PAROLE CHIAVE ====================

// Carica parole chiave
async function loadKeywordsFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('keywords')
            .select('*')
            .order('name');
        
        if (error) {
            if (handleSessionError(error)) return;
            throw error;
        }
        
        userKeywords = data.map(kw => ({
            id: kw.id,
            userId: kw.user_id,
            name: kw.name,
            dateCreated: new Date(kw.created_at).toLocaleDateString('it-IT')
        }));
        
        console.log(`✅ Caricate ${userKeywords.length} parole chiave`);
        
    } catch (error) {
        console.error('❌ Errore caricamento parole chiave:', error);
        userKeywords = [];
    }
}

// Salva parola chiave
async function saveKeywordToSupabase(keywordName) {
    try {
        const { data, error } = await supabase
            .from('keywords')
            .insert({
                user_id: currentUser.id,
                name: keywordName
            })
            .select()
            .single();
        
        if (error) {
            if (handleSessionError(error)) return;
            throw error;
        }
        
        console.log('✅ Parola chiave salvata:', data.id);
        return data.id;
        
    } catch (error) {
        console.error('❌ Errore salvataggio parola chiave:', error);
        throw error;
    }
}

// Elimina parola chiave
async function deleteKeywordFromSupabase(keywordId) {
    try {
        const { error } = await supabase
            .from('keywords')
            .delete()
            .eq('id', keywordId);
        
        if (error) {
            if (handleSessionError(error)) return;
            throw error;
        }
        
        console.log('✅ Parola chiave eliminata');
        
    } catch (error) {
        console.error('❌ Errore eliminazione parola chiave:', error);
        throw error;
    }
}

// ==================== LIBRERIE ====================

// Carica librerie
async function loadLibrariesFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('libraries')
            .select('*')
            .order('name');
        
        if (error) {
            if (handleSessionError(error)) return;
            throw error;
        }
        
        userLibraries = data.map(lib => ({
            id: lib.id,
            userId: lib.user_id,
            name: lib.name,
            dateCreated: new Date(lib.created_at).toLocaleDateString('it-IT')
        }));
        
        console.log(`✅ Caricate ${userLibraries.length} librerie`);
        
    } catch (error) {
        console.error('❌ Errore caricamento librerie:', error);
        userLibraries = [];
    }
}

// Salva libreria
async function saveLibraryToSupabase(libraryName) {
    try {
        const { data, error } = await supabase
            .from('libraries')
            .insert({
                user_id: currentUser.id,
                name: libraryName
            })
            .select()
            .single();
        
        if (error) {
            if (handleSessionError(error)) return;
            throw error;
        }
        
        console.log('✅ Libreria salvata:', data.id);
        return data.id;
        
    } catch (error) {
        console.error('❌ Errore salvataggio libreria:', error);
        throw error;
    }
}

// Elimina libreria
async function deleteLibraryFromSupabase(libraryId) {
    try {
        const { error } = await supabase
            .from('libraries')
            .delete()
            .eq('id', libraryId);
        
        if (error) {
            if (handleSessionError(error)) return;
            throw error;
        }
        
        console.log('✅ Libreria eliminata');
        
    } catch (error) {
        console.error('❌ Errore eliminazione libreria:', error);
        throw error;
    }
}
