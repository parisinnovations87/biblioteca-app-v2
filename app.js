// ========================================
// BIBLIOTECA DOMESTICA - APP PRINCIPALE
// Versione con Supabase
// ========================================

// Inizializzazione app
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 Biblioteca Domestica - Inizializzazione...');
    
    setupBarcodeScannerButton();
    initializeSearchFilters();
});

// Carica tutti i dati utente
async function loadBooks() {
    await loadBooksFromSupabase();
}

// === GESTIONE TAB ===

function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    switch(tabName) {
        case 'library':
            displayBooks();
            updateBookCount();
            break;
        case 'search':
            updateSearchFilters();
            setupSearchListeners();
            break;
        case 'libraries':
            displayLibraries();
            break;
        case 'categories':
            displayCategories();
            break;
        case 'keywords':
            displayKeywords();
            break;
    }
}

// === GESTIONE LIBRI ===

async function addBook() {
    const title = document.getElementById('title').value.trim();
    const genreSelect = document.getElementById('genre');
    const shelfSelect = document.getElementById('shelf');
    
    if (!title || !genreSelect.value || !shelfSelect.value) {
        showAlert('Compila i campi obbligatori: Titolo, Categoria e Libreria', 'error');
        return;
    }
    
    // Trova gli ID di categoria e libreria
    const categoryId = userCategories.find(c => c.name === genreSelect.value)?.id;
    const libraryId = userLibraries.find(l => l.name === shelfSelect.value)?.id;
    
    // Trova gli ID delle parole chiave selezionate
    const keywordIds = getSelectedKeywordsArray()
        .map(kwName => userKeywords.find(kw => kw.name === kwName)?.id)
        .filter(id => id);
    
    const bookData = {
        title: title,
        author: document.getElementById('author').value.trim(),
        isbn: document.getElementById('isbn').value.trim(),
        publisher: document.getElementById('publisher').value.trim(),
        year: document.getElementById('year').value,
        categoryId: categoryId,
        libraryId: libraryId,
        keywordIds: keywordIds,
        position: document.getElementById('position').value.trim(),
        condition: document.getElementById('condition').value,
        notes: document.getElementById('notes').value.trim()
    };
    
    try {
        if (isEditMode && editingBookId) {
            // Modifica libro esistente
            await updateBookInSupabase(editingBookId, bookData);
            showAlert('Libro modificato con successo!', 'success');
            resetEditMode();
        } else {
            // Nuovo libro
            await saveBookToSupabase(bookData);
            showAlert('Libro aggiunto alla biblioteca!', 'success');
        }
        
        clearForm();
        await loadBooks();
        updateBookCount();
        
    } catch (error) {
        console.error('❌ Errore salvataggio libro:', error);
        showAlert('Errore nel salvataggio: ' + error.message, 'error');
    }
}

function editBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    showTab('add');
    document.querySelector('.tab[onclick*="add"]').classList.add('active');
    
    document.getElementById('title').value = book.title || '';
    document.getElementById('author').value = book.author || '';
    document.getElementById('isbn').value = book.isbn || '';
    document.getElementById('publisher').value = book.publisher || '';
    document.getElementById('year').value = book.year || '';
    document.getElementById('genre').value = book.genre || '';
    document.getElementById('shelf').value = book.shelf || '';
    document.getElementById('position').value = book.position || '';
    document.getElementById('condition').value = book.condition || '';
    document.getElementById('notes').value = book.notes || '';
    setSelectedKeywords(book.keywords || '');
    
    isEditMode = true;
    editingBookId = bookId;
    document.getElementById('addBookBtn').innerHTML = '💾 Salva Modifiche';
    
    showAlert('Modalità modifica attivata', 'info');
}

function resetEditMode() {
    isEditMode = false;
    editingBookId = null;
    document.getElementById('addBookBtn').innerHTML = '📚 Aggiungi alla Biblioteca';
}

async function deleteBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    if (!confirm(`Sei sicuro di voler eliminare "${book.title}" dalla tua biblioteca?`)) {
        return;
    }
    
    try {
        await deleteBookFromSupabase(bookId);
        await loadBooks();
        updateBookCount();
        showAlert('Libro eliminato dalla biblioteca', 'success');
        
    } catch (error) {
        console.error('❌ Errore eliminazione libro:', error);
        showAlert('Errore durante l\'eliminazione: ' + error.message, 'error');
    }
}

// === VISUALIZZAZIONE LIBRI ===

function displayBooks(booksToShow = books) {
    const booksList = document.getElementById('booksList');
    
    if (booksToShow.length === 0) {
        booksList.innerHTML = `
            <div class="empty-state">
                <div class="icon">📚</div>
                <h3>Nessun libro nella biblioteca</h3>
                <p>Inizia ad aggiungere i tuoi libri preferiti!</p>
            </div>
        `;
        return;
    }
    
    booksList.innerHTML = booksToShow.map(book => `
        <div class="book-card">
            <div class="book-info">
                <div class="book-cover">
                    ${getGenreIcon(book.genre)}
                </div>
                <div class="book-details">
                    <h3>${book.title}</h3>
                    <p><strong>Autore:</strong> ${book.author || 'Non specificato'}</p>
                    <p><strong>Categoria:</strong> ${book.genre}</p>
                    ${book.keywords ? `<p><strong>Parole chiave:</strong> ${book.keywords}</p>` : ''}
                    ${book.year ? `<p><strong>Anno:</strong> ${book.year}</p>` : ''}
                    ${book.publisher ? `<p><strong>Editore:</strong> ${book.publisher}</p>` : ''}
                    <p><strong>Posizione:</strong> ${book.shelf}${book.position ? ' - ' + book.position : ''}</p>
                    ${book.condition ? `<p><strong>Condizioni:</strong> ${book.condition}</p>` : ''}
                    <p><strong>Aggiunto il:</strong> ${book.addedDate}</p>
                    ${book.notes ? `<p><strong>Note:</strong> ${book.notes}</p>` : ''}
                </div>
                <div class="book-actions">
                    <button class="edit-btn" onclick="editBook('${book.id}')">Modifica</button>
                    <button class="delete-btn" onclick="deleteBook('${book.id}')">Elimina</button>
                </div>
            </div>
        </div>
    `).join('');
}

function getGenreIcon(genre) {
    const icons = {
        'Narrativa': '📖',
        'Saggistica': '📄',
        'Giallo/Thriller': '🔍',
        'Fantascienza': '🚀',
        'Fantasy': '🧙‍♂️',
        'Romance': '💕',
        'Biografia': '👤',
        'Storia': '📜',
        'Cucina': '👨‍🍳',
        'Arte': '🎨',
        'Scienze': '🔬',
        'Tecnologia': '💻',
        'Viaggi': '✈️',
        'Religione': '📿',
        'Filosofia': '🤔',
        'Bambini': '🧸',
        'Fumetti': '💭'
    };
    return icons[genre] || '📚';
}

// === RICERCA E FILTRI ===

function searchBooks() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const genreFilter = document.getElementById('filterGenre').value;
    const shelfFilter = document.getElementById('filterShelf').value;
    
    let filteredBooks = books;
    
    if (query) {
        filteredBooks = filteredBooks.filter(book => 
            book.title.toLowerCase().includes(query) ||
            (book.author && book.author.toLowerCase().includes(query)) ||
            book.genre.toLowerCase().includes(query) ||
            (book.keywords && book.keywords.toLowerCase().includes(query)) ||
            book.shelf.toLowerCase().includes(query) ||
            (book.notes && book.notes.toLowerCase().includes(query))
        );
    }
    
    if (genreFilter) {
        filteredBooks = filteredBooks.filter(book => book.genre === genreFilter);
    }
    
    if (shelfFilter) {
        filteredBooks = filteredBooks.filter(book => book.shelf === shelfFilter);
    }
    
    displayBooksInContainer(filteredBooks, 'searchResults');
}

function setupSearchListeners() {
    const searchInput = document.getElementById('searchInput');
    const filterGenre = document.getElementById('filterGenre');
    const filterShelf = document.getElementById('filterShelf');
    
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    const newFilterGenre = filterGenre.cloneNode(true);
    filterGenre.parentNode.replaceChild(newFilterGenre, filterGenre);
    
    const newFilterShelf = filterShelf.cloneNode(true);
    filterShelf.parentNode.replaceChild(newFilterShelf, filterShelf);
    
    document.getElementById('searchInput').addEventListener('input', searchBooks);
    document.getElementById('filterGenre').addEventListener('change', searchBooks);
    document.getElementById('filterShelf').addEventListener('change', searchBooks);
    
    searchBooks();
}

function displayBooksInContainer(booksToShow, containerId) {
    const container = document.getElementById(containerId);
    
    if (booksToShow.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">🔍</div>
                <h3>Nessun risultato trovato</h3>
                <p>Prova con altri termini di ricerca</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = booksToShow.map(book => `
        <div class="book-card">
            <div class="book-info">
                <div class="book-cover">
                    ${getGenreIcon(book.genre)}
                </div>
                <div class="book-details">
                    <h3>${book.title}</h3>
                    <p><strong>Autore:</strong> ${book.author || 'Non specificato'}</p>
                    <p><strong>Categoria:</strong> ${book.genre}</p>
                    ${book.keywords ? `<p><strong>Parole chiave:</strong> ${book.keywords}</p>` : ''}
                    <p><strong>Posizione:</strong> ${book.shelf}${book.position ? ' - ' + book.position : ''}</p>
                    ${book.notes ? `<p><strong>Note:</strong> ${book.notes}</p>` : ''}
                </div>
                <div class="book-actions">
                    <button class="edit-btn" onclick="editBook('${book.id}')">Modifica</button>
                    <button class="delete-btn" onclick="deleteBook('${book.id}')">Elimina</button>
                </div>
            </div>
        </div>
    `).join('');
}

// === ORDINAMENTO ===

function sortBooks() {
    const sortBy = document.getElementById('sortSelect').value;
    
    books.sort((a, b) => {
        switch(sortBy) {
            case 'title':
                return a.title.localeCompare(b.title, 'it');
            case 'author':
                return (a.author || '').localeCompare(b.author || '', 'it');
            case 'genre':
                return a.genre.localeCompare(b.genre, 'it');
            case 'date':
                return new Date(b.addedDate.split('/').reverse().join('-')) - 
                       new Date(a.addedDate.split('/').reverse().join('-'));
            case 'shelf':
                return a.shelf.localeCompare(b.shelf, 'it');
            default:
                return 0;
        }
    });
    
    displayBooks();
}

// === UTILITY ===

function clearForm() {
    const inputs = ['barcodeInput', 'title', 'author', 'isbn', 'publisher', 'year', 'position', 'notes'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    
    const selects = ['genre', 'shelf', 'condition', 'keywords'];
    selects.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });

    const selectedKeywordsDiv = document.getElementById('selectedKeywords');
    if (selectedKeywordsDiv) {
        selectedKeywordsDiv.innerHTML = '';
    }
    
    resetEditMode();
}

function updateBookCount() {
    const countElement = document.getElementById('bookCount');
    if (countElement) {
        const count = books.length;
        countElement.textContent = count === 1 ? '1 libro' : `${count} libri`;
    }
}

function initializeSearchFilters() {
    // Sarà popolato quando i libri vengono caricati
}

function updateSearchFilters() {
    const genreFilter = document.getElementById('filterGenre');
    const shelfFilter = document.getElementById('filterShelf');
    
    if (!genreFilter || !shelfFilter) return;
    
    const genres = [...new Set(books.map(book => book.genre))].sort();
    genreFilter.innerHTML = '<option value="">Tutte le categorie</option>';
    genres.forEach(genre => {
        genreFilter.innerHTML += `<option value="${genre}">${genre}</option>`;
    });
    
    const shelves = [...new Set(books.map(book => book.shelf))].sort();
    shelfFilter.innerHTML = '<option value="">Tutti gli scaffali</option>';
    shelves.forEach(shelf => {
        shelfFilter.innerHTML += `<option value="${shelf}">${shelf}</option>`;
    });
}

function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    
    if (!alertContainer) {
        console.log(`${type.toUpperCase()}: ${message}`);
        return;
    }
    
    const existingAlerts = alertContainer.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
    
    alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// === SCANNER BARCODE ===

function setupBarcodeScannerButton() {
    setTimeout(() => {
        const scanBtn = document.querySelector('.scan-btn');
        if (scanBtn) {
            scanBtn.onclick = function(e) {
                e.preventDefault();
                startScanner();
            };
            console.log('✅ Pulsante scanner configurato');
        }
    }, 1000);
}

async function startScanner() {
    console.log('🎬 startScanner chiamata');
    
    if (scannerActive) {
        console.log('ℹ️ Scanner già attivo, fermando...');
        stopScanner();
        return;
    }

    const scanner = document.getElementById('scanner');
    const scanBtn = document.querySelector('.scan-btn');
    
    scanner.style.display = 'block';
    scanner.innerHTML = `
        <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #f8f9ff, #e3f2fd); border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <h3 style="color: #667eea; margin-bottom: 20px;">📷 Accesso Fotocamera</h3>
            <p style="color: #666; margin-bottom: 25px; line-height: 1.6;">
                Per usare lo scanner, devi consentire l'accesso alla fotocamera.<br>
                Clicca sul pulsante e seleziona <strong>"Consenti"</strong>.
            </p>
            <button id="requestPermissionBtn" style="
                background: linear-gradient(45deg, #28a745, #20c997);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 12px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                margin-bottom: 15px;
            ">
                🔓 Richiedi Permesso Fotocamera
            </button>
            <br>
            <button onclick="stopScanner()" class="stop-scanner-btn" style="margin-top: 10px;">Annulla</button>
            
            <div id="permission-status" style="margin-top: 20px; padding: 15px; background: white; border-radius: 10px; display: none;">
                <p style="color: #666; margin: 0;"></p>
            </div>
        </div>
    `;

    const requestBtn = document.getElementById('requestPermissionBtn');
    const statusDiv = document.getElementById('permission-status');
    
    requestBtn.onclick = async function() {
        console.log('🔓 Richiesta permessi...');
        
        requestBtn.disabled = true;
        requestBtn.innerHTML = '<div class="loading"></div> Attendere...';
        requestBtn.style.opacity = '0.7';
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            console.log('✅ Permesso ottenuto!');
            stream.getTracks().forEach(track => track.stop());
            
            statusDiv.style.display = 'block';
            statusDiv.style.background = '#d4edda';
            statusDiv.querySelector('p').innerHTML = '✅ <strong>Permesso concesso!</strong> Avvio scanner...';
            statusDiv.querySelector('p').style.color = '#155724';
            
            setTimeout(() => {
                initializeQuaggaScanner();
            }, 1000);
            
        } catch (error) {
            console.error('❌ Permesso negato:', error);
            
            requestBtn.disabled = false;
            requestBtn.innerHTML = '🔓 Riprova';
            requestBtn.style.opacity = '1';
            
            let errorMsg = '';
            let solution = '';
            
            if (error.name === 'NotAllowedError') {
                errorMsg = '🚫 Permesso negato';
                solution = `
                    <strong style="color: #dc3545;">Il browser ha bloccato l'accesso.</strong><br><br>
                    
                    <div style="text-align: left; margin-top: 10px;">
                        <strong>Su Android/Mobile:</strong><br>
                        1. Tocca l'icona <strong>🔒</strong> nella barra indirizzi<br>
                        2. Tocca "Autorizzazioni" o "Impostazioni sito"<br>
                        3. Cambia "Fotocamera" da Blocca a Consenti<br>
                        4. Ricarica la pagina<br><br>
                        
                        <strong>Su PC/Desktop:</strong><br>
                        1. Clicca l'icona <strong>🔒</strong> nella barra indirizzi<br>
                        2. Clicca su "Fotocamera"<br>
                        3. Seleziona "Consenti"<br>
                        4. Ricarica con Ctrl+Shift+R
                    </div>
                `;
            } else if (error.name === 'NotFoundError') {
                errorMsg = '📷 Fotocamera non trovata';
                solution = 'Il dispositivo non ha una fotocamera disponibile.';
            } else {
                errorMsg = '❌ Errore: ' + error.name;
                solution = error.message;
            }
            
            statusDiv.style.display = 'block';
            statusDiv.style.background = '#f8d7da';
            statusDiv.querySelector('p').innerHTML = `
                <strong>${errorMsg}</strong><br><br>
                ${solution}
            `;
            statusDiv.querySelector('p').style.color = '#721c24';
            statusDiv.querySelector('p').style.fontSize = '0.9rem';
        }
    };
    
    if (scanBtn) {
        scanBtn.innerHTML = '❎ Chiudi';
    }
}

async function initializeQuaggaScanner() {
    const scanner = document.getElementById('scanner');
    
    scanner.innerHTML = `
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #f8f9ff, #e3f2fd); border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div class="scanner-status">
                <p style="color: #667eea; font-weight: 600; font-size: 1.1rem; margin-bottom: 10px;">
                    📷 Inizializzazione scanner...
                </p>
                <div class="loading"></div>
            </div>
            <div id="scanner-container" style="margin-top: 20px; display: none;">
                <div id="interactive" class="viewport" style="position: relative; width: 100%; max-width: 640px; margin: 0 auto; background: #000; border-radius: 12px; overflow: hidden;">
                    <video style="width: 100%; height: auto; display: block;"></video>
                    <canvas class="drawingBuffer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>
                </div>
                <p style="margin-top: 15px; color: white; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 20px; display: inline-block;">
                    🎯 Inquadra il codice a barre nel riquadro
                </p>
            </div>
            <button onclick="stopScanner()" class="stop-scanner-btn" style="margin-top: 20px;">❌ Chiudi Scanner</button>
        </div>
    `;

    try {
        if (typeof Quagga === 'undefined') {
            throw new Error('Libreria Quagga non caricata. Ricarica la pagina.');
        }

        console.log('🎥 Inizializzazione Quagga...');
        
        const config = {
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#interactive'),
                constraints: {
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    facingMode: "environment",
                    aspectRatio: { min: 1, max: 2 }
                },
                area: {
                    top: "25%",
                    right: "10%",
                    left: "10%",
                    bottom: "25%"
                }
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: navigator.hardwareConcurrency || 4,
            frequency: 10,
            decoder: {
                readers: [
                    "ean_reader",
                    "ean_8_reader",
                    "code_128_reader",
                    "code_39_reader",
                    "upc_reader",
                    "upc_e_reader"
                ],
                multiple: false
            },
            locate: true
        };

        Quagga.init(config, function(err) {
            if (err) {
                console.error('❌ Errore inizializzazione Quagga:', err);
                showAlert('Errore: ' + err.message, 'error');
                stopScanner();
                return;
            }
            
            console.log('✅ Quagga inizializzato');
            
            document.getElementById('scanner-container').style.display = 'block';
            
            const statusElement = document.querySelector('.scanner-status');
            if (statusElement) {
                statusElement.innerHTML = `
                    <p style="color: #28a745; font-weight: 600; font-size: 1.1rem;">
                        ✅ Scanner attivo
                    </p>
                    <p style="color: #666; font-size: 0.9rem;">
                        Inquadra il codice a barre
                    </p>
                `;
            }
            
            Quagga.start();
            scannerActive = true;
            
            console.log('✅ Scanner Quagga avviato');
        });

        Quagga.onDetected(function(result) {
            if (result && result.codeResult && result.codeResult.code) {
                const code = result.codeResult.code;
                
                if (code && code.length >= 8 && /^[0-9]+$/.test(code)) {
                    console.log('✅ CODICE RILEVATO:', code);
                    handleBarcodeDetected(code);
                } else {
                    console.log('⚠️ Codice non valido ignorato:', code);
                }
            }
        });

        Quagga.onProcessed(function(result) {
            const drawingCtx = Quagga.canvas.ctx.overlay;
            const drawingCanvas = Quagga.canvas.dom.overlay;

            if (result) {
                if (result.boxes) {
                    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                    
                    result.boxes.filter(box => box !== result.box).forEach(box => {
                        Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {
                            color: "yellow",
                            lineWidth: 2
                        });
                    });
                }

                if (result.box) {
                    Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {
                        color: "lime",
                        lineWidth: 3
                    });
                }

                if (result.codeResult && result.codeResult.code) {
                    Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {
                        color: 'red',
                        lineWidth: 3
                    });
                }
            }
        });

    } catch (error) {
        console.error('❌ Errore inizializzazione:', error);
        showAlert('Errore: ' + error.message, 'error');
        stopScanner();
    }
}

function handleBarcodeDetected(code) {
    console.log('🎯 Gestione codice rilevato:', code);
    
    if (!code || code.length < 8) {
        console.log('❌ Codice non valido (troppo corto)');
        return;
    }
    
    if (document.getElementById('barcodeInput').value === code) {
        console.log('⚠️ Codice già inserito, ignoro');
        return;
    }
    
    stopScanner();
    
    playBeep();
    document.getElementById('barcodeInput').value = code;
    showAlert(`✅ Codice rilevato: ${code}`, 'success');
    
    setTimeout(() => {
        searchByBarcode();
    }, 800);
}

function stopScanner() {
    console.log('ℹ️ Fermando scanner...');
    
    if (typeof Quagga !== 'undefined' && scannerActive) {
        try {
            Quagga.stop();
            console.log('✅ Quagga fermato');
        } catch (error) {
            console.error('Errore stop Quagga:', error);
        }
    }

    scannerActive = false;

    const scanner = document.getElementById('scanner');
    if (scanner) {
        scanner.style.display = 'none';
        scanner.innerHTML = '';
    }
    
    const scanBtn = document.querySelector('.scan-btn');
    if (scanBtn) {
        scanBtn.innerHTML = '📷 Scansiona Codice';
    }

    console.log('✅ Scanner fermato');
}

function playBeep() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        console.log('Audio non disponibile');
    }
}

// === RICERCA LIBRI ONLINE ===

async function searchByBarcode() {
    const barcode = document.getElementById('barcodeInput').value.trim();
    
    if (!barcode) {
        showAlert('Inserisci un codice a barre o ISBN', 'error');
        return;
    }
    
    const searchBtn = document.querySelector('.search-btn');
    const originalText = searchBtn.innerHTML;
    searchBtn.innerHTML = '<span class="loading"></span> Ricerca...';
    searchBtn.disabled = true;
    
    try {
        let bookFound = await searchOpenLibrary(barcode);
        
        if (!bookFound) {
            bookFound = await searchGoogleBooks(barcode);
        }
        
        if (!bookFound) {
            showAlert('Libro non trovato nei database online. Inserisci i dati manualmente.', 'error');
        }
        
    } catch (error) {
        console.error('Errore nella ricerca:', error);
        showAlert('Errore durante la ricerca. Verifica la connessione internet.', 'error');
    } finally {
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;
    }
}

async function searchOpenLibrary(isbn) {
    try {
        const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
        const data = await response.json();
        
        const bookKey = `ISBN:${isbn}`;
        if (data[bookKey]) {
            const book = data[bookKey];
            fillBookFormFromOpenLibrary(book, isbn);
            showAlert('Dati del libro trovati su Open Library!', 'success');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Errore Open Library:', error);
        return false;
    }
}

async function searchGoogleBooks(isbn) {
    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            const book = data.items[0].volumeInfo;
            fillBookFormFromGoogle(book, isbn);
            showAlert('Dati del libro trovati su Google Books!', 'success');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Errore Google Books:', error);
        return false;
    }
}

function fillBookFormFromOpenLibrary(book, isbn) {
    document.getElementById('title').value = book.title || '';
    document.getElementById('author').value = book.authors ? book.authors.map(a => a.name).join(', ') : '';
    document.getElementById('isbn').value = isbn;
    document.getElementById('publisher').value = book.publishers ? book.publishers[0].name : '';
    document.getElementById('year').value = book.publish_date ? extractYear(book.publish_date) : '';
}

function fillBookFormFromGoogle(book, isbn) {
    document.getElementById('title').value = book.title || '';
    document.getElementById('author').value = book.authors ? book.authors.join(', ') : '';
    document.getElementById('isbn').value = isbn;
    document.getElementById('publisher').value = book.publisher || '';
    document.getElementById('year').value = book.publishedDate ? book.publishedDate.split('-')[0] : '';
}

function extractYear(dateString) {
    const match = dateString.match(/\d{4}/);
    return match ? match[0] : '';
}