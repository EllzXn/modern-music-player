const API_SEARCH = 'https://etzy-api.vercel.app/search/youtube?q=';
const API_PLAY = 'https://etzy-api.vercel.app/downloader/savetube?url=';

// DOM Elements Mapped
const els = {
    header: document.getElementById('main-header'),
    searchToggle: document.getElementById('search-toggle-btn'),
    searchContainer: document.getElementById('search-container'),
    searchForm: document.getElementById('search-form'),
    searchInput: document.getElementById('search-input'),
    searchIconWrapper: document.getElementById('search-icon-wrapper'), 
    contentArea: document.getElementById('content-area'),
    toast: document.getElementById('toast'), 
    toastMsg: document.getElementById('toast-msg'),

    exploreArea: document.getElementById('explore-area'),
    quickPicksContainer: document.getElementById('quick-picks-container'), 
    quickPicksList: document.getElementById('quick-picks-list'), 
    greeting: document.getElementById('greeting-container'),

    resultsArea: document.getElementById('results-area'),
    msgArea: document.getElementById('message-area'),

    // Tabs
    tabSearch: document.getElementById('tab-search'),
    tabLibrary: document.getElementById('tab-library'),
    libTabLiked: document.getElementById('lib-tab-liked'),
    libTabPlaylists: document.getElementById('lib-tab-playlists'),
    tabHistory: document.getElementById('tab-history'), 
    libraryArea: document.getElementById('library-area'),
    libraryList: document.getElementById('library-list'),
    playlistList: document.getElementById('playlist-list'), 
    libContentLiked: document.getElementById('lib-content-liked'),
    libContentPlaylists: document.getElementById('lib-content-playlists'),
    btnCreatePlaylist: document.getElementById('btn-create-playlist'),
    emptyLibraryMsg: document.getElementById('empty-library-msg'),
    emptyPlaylistMsg: document.getElementById('empty-playlist-msg'),

    // Playlist View Elements
    playlistView: document.getElementById('playlist-view'),
    viewPlCover: document.getElementById('view-pl-cover'),
    viewPlName: document.getElementById('view-pl-name'),
    viewPlCount: document.getElementById('view-pl-count'),
    viewPlSongs: document.getElementById('view-pl-songs'),
    // emptyViewPlMsg removed in HTML redesign, handled logically
    btnPlayPlaylist: document.getElementById('btn-play-playlist'),
    btnDeletePlaylist: document.getElementById('btn-delete-playlist'),

    // Modal Create
    playlistModal: document.getElementById('playlist-modal'),
    playlistNameInput: document.getElementById('playlist-name-input'),
    closePlaylistModal: document.getElementById('close-playlist-modal'),
    savePlaylistBtn: document.getElementById('save-playlist-btn'),

    // Modal Add to Playlist
    addToPlaylistModal: document.getElementById('add-to-playlist-modal'),
    selectPlaylistList: document.getElementById('select-playlist-list'),
    closeSelectModal: document.getElementById('close-select-modal'),

    // History
    historyArea: document.getElementById('history-area'),
    historyList: document.getElementById('history-list'),
    emptyHistoryMsg: document.getElementById('empty-history-msg'),

    playerOverlay: document.getElementById('player-overlay'),
    closePlayerBtn: document.getElementById('close-player-btn'),
    pCover: document.getElementById('player-cover'),
    pBg: document.getElementById('player-bg-image'),
    pTitle: document.getElementById('player-title'),
    pArtist: document.getElementById('player-artist'),
    marqueeWrapper: document.getElementById('marquee-wrapper'),
    fullLikeBtn: document.getElementById('full-like-btn'),

    // Menu Options
    optionsBtn: document.getElementById('options-btn'),
    optionsMenu: document.getElementById('options-menu'),
    menuShareBtn: document.getElementById('menu-share-btn'),
    menuDownloadBtn: document.getElementById('menu-download-btn'),
    menuAddPlaylistBtn: document.getElementById('menu-add-playlist-btn'),

    miniPlayer: document.getElementById('mini-player'),
    miniCover: document.getElementById('mini-cover'),
    miniTitle: document.getElementById('mini-title'),
    miniArtist: document.getElementById('mini-artist'),
    miniPlayBtn: document.getElementById('mini-play-btn'),
    miniPlayIcon: document.getElementById('mini-play-icon'),
    miniPauseIcon: document.getElementById('mini-pause-icon'),
    miniLikeBtn: document.getElementById('mini-like-btn'),

    audio: document.getElementById('audio-player'),
    playBtn: document.getElementById('play-pause-btn'),
    playIcon: document.getElementById('play-icon'),
    pauseIcon: document.getElementById('pause-icon'),
    nextBtn: document.getElementById('next-btn'),
    prevBtn: document.getElementById('prev-btn'),
    loopBtn: document.getElementById('loop-btn'),
    loopDot: document.getElementById('loop-dot'),

    progCont: document.getElementById('progress-container'),
    progFill: document.getElementById('progress-fill'),
    currTime: document.getElementById('current-time'),
    durTime: document.getElementById('duration'),
    volSlider: document.getElementById('volume-slider')
};

// --- GLOBAL VARIABLES ---
let playlist = []; 
let searchResults = []; 
let quickPicks = []; 
let favorites = JSON.parse(localStorage.getItem('ztune_likes')) || [];
let history = JSON.parse(localStorage.getItem('ztune_history')) || [];
let savedPlaylists = JSON.parse(localStorage.getItem('ztune_playlists')) || []; 

let currentSongIndex = -1;
let isSearchVisible = false;
let currentContext = 'search'; 
let currentLibTab = 'liked';

let activeLoadingBtn = null;
let originalIconHTML = '';
let originalSearchIconHTML = els.searchIconWrapper.innerHTML; 
let toastTimeout;

let currentOpenPlaylistId = null;

// --- INIT ---
window.addEventListener('DOMContentLoaded', () => {
    initQuickPicks();
    checkUrlParams();
    initPlaylists();

    // AUTO INIT LIBRARY UI
    if (currentLibTab === 'liked') showLikedSongs();
});

// --- CHECK URL PARAMS ---
function checkUrlParams() {
    const hash = window.location.hash;
    if(hash && hash.startsWith('#lagu=')) {
        const songUrl = decodeURIComponent(hash.substring(6)); 
        if(songUrl) {
            const tempItem = { link: songUrl, title: 'Loading...', imageUrl: 'https://via.placeholder.com/300', channel: 'Loading...' };
            playSong(tempItem, 0, 'shared');
        }
    }
}

// --- OPTIONS MENU LOGIC ---
els.optionsBtn.onclick = (e) => {
    e.stopPropagation();
    els.optionsMenu.classList.toggle('hidden');
};

document.addEventListener('click', (e) => {
    if (!els.optionsBtn.contains(e.target) && !els.optionsMenu.contains(e.target)) {
        els.optionsMenu.classList.add('hidden');
    }
});

// --- ADD TO PLAYLIST LOGIC ---
els.menuAddPlaylistBtn.onclick = (e) => {
    e.stopPropagation();
    els.optionsMenu.classList.add('hidden');

    if(currentSongIndex === -1 || !playlist[currentSongIndex]) return;

    renderSelectPlaylistList();
    els.addToPlaylistModal.classList.remove('hidden');
};

els.closeSelectModal.onclick = () => {
    els.addToPlaylistModal.classList.add('hidden');
};

function renderSelectPlaylistList() {
    els.selectPlaylistList.innerHTML = '';
    if(savedPlaylists.length === 0) {
            els.selectPlaylistList.innerHTML = '<p class="text-xs text-gray-500 text-center py-4 tracking-widest uppercase">No collections found.</p>';
            return;
    }

    savedPlaylists.forEach(pl => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left px-4 py-4 border-b border-white/5 hover:bg-white/5 text-sm text-white flex items-center justify-between transition-colors';
        btn.innerHTML = `
            <span class="font-serif font-bold truncate">${pl.name}</span>
            <span class="text-[10px] text-gray-500 uppercase tracking-widest">${pl.songs.length} Tracks</span>
        `;
        btn.onclick = () => saveToPlaylist(pl.id);
        els.selectPlaylistList.appendChild(btn);
    });
}

function saveToPlaylist(playlistId) {
    const song = playlist[currentSongIndex];
    const plIndex = savedPlaylists.findIndex(p => p.id === playlistId);

    if(plIndex !== -1) {
        const exists = savedPlaylists[plIndex].songs.some(s => s.link === song.link);
        if(!exists) {
            savedPlaylists[plIndex].songs.push(song);
            localStorage.setItem('ztune_playlists', JSON.stringify(savedPlaylists));
            showToast(`Added to ${savedPlaylists[plIndex].name}`);
        } else {
            showToast("Already in Collection");
        }
        els.addToPlaylistModal.classList.add('hidden');

        if(!els.libContentPlaylists.classList.contains('hidden')) renderPlaylists();
    }
}

// --- SHARE LOGIC ---
els.menuShareBtn.onclick = async () => {
    els.optionsMenu.classList.add('hidden'); 
    if(currentSongIndex !== -1 && playlist[currentSongIndex]) {
        const song = playlist[currentSongIndex];
        const shareUrl = `${window.location.origin}${window.location.pathname}#lagu=${encodeURIComponent(song.link)}`;

        const shareData = {
            title: 'ZTune Luxury',
            text: `Listen to ${song.title} on ZTune.`,
            url: shareUrl
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch(err) { console.log(err); }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showToast("Link Copied");
            } catch(err) {
                showToast("Failed to Copy");
            }
        }
    }
};

// --- QUICK PICKS LOGIC ---
async function initQuickPicks() {
    if (history.length > 0) {
        const lastPlayed = history[0];
        const artist = lastPlayed.channel;
        if(artist && artist !== 'Artist') {
            try {
                const res = await fetch(API_SEARCH + encodeURIComponent(artist));
                const data = await res.json();
                if(data.status && data.result && data.result.length > 0) {
                    quickPicks = data.result.filter(i => i.title && i.link).slice(0, 5); 
                    renderQuickPicks();
                }
            } catch (e) { console.log('Quick picks fetch failed'); }
        }
    }
}

function renderQuickPicks() {
    if(quickPicks.length === 0) return;
    els.quickPicksList.innerHTML = '';
    els.quickPicksContainer.classList.remove('hidden');

    quickPicks.forEach((item, index) => {
        const div = createSongElement(item, index, 'quickpicks'); 
        els.quickPicksList.appendChild(div);
    });
}

// --- SCROLL HEADER ---
els.contentArea.addEventListener('scroll', () => {
    if (els.contentArea.scrollTop > 20) {
        els.header.classList.add('bg-background/80', 'backdrop-blur-xl', 'border-b', 'border-white/5');
    } else {
        els.header.classList.remove('bg-background/80', 'backdrop-blur-xl', 'border-b', 'border-white/5');
    }
});

// --- SWIPE LOGIC ---
let touchStartX = 0;
let touchEndX = 0;
const tabsOrder = ['search', 'library', 'history'];

els.contentArea.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

els.contentArea.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, {passive: true});

function handleSwipe() {
    const swipeThreshold = 50; 
    const currentIndex = tabsOrder.indexOf(currentContext);
    if (touchEndX - touchStartX > swipeThreshold) {
        if (currentIndex > 0) switchTab(tabsOrder[currentIndex - 1]);
    }
    if (touchStartX - touchEndX > swipeThreshold) {
        if (currentIndex < tabsOrder.length - 1) switchTab(tabsOrder[currentIndex + 1]);
    }
}

// --- TABS ---
function switchTab(tab) {
    currentContext = tab;

    // Reset styles
    [els.tabSearch, els.tabLibrary, els.tabHistory].forEach(el => el.classList.remove('active'));

    if (tab === 'search') els.tabSearch.classList.add('active');
    else if (tab === 'library') els.tabLibrary.classList.add('active');
    else if (tab === 'history') els.tabHistory.classList.add('active');

    els.libraryArea.classList.add('hidden');
    els.historyArea.classList.add('hidden');
    els.exploreArea.classList.add('hidden');
    els.resultsArea.classList.add('hidden');

    if(!els.playlistView.classList.contains('hidden')) {
        els.playlistView.classList.add('hidden');
        currentOpenPlaylistId = null;
    }

    if (tab === 'search') {
        if (searchResults.length > 0) {
            els.resultsArea.classList.remove('hidden');
        } else {
            if(!isSearchVisible) els.exploreArea.classList.remove('hidden');
        }
    } else if (tab === 'library') {
        els.libraryArea.classList.remove('hidden');
        if (currentLibTab === 'liked') showLikedSongs();
        else showPlaylists();
    } else if (tab === 'history') {
        els.historyArea.classList.remove('hidden');
        renderHistory();
    }

    if(isSearchVisible && tab !== 'search') {
        els.searchToggle.click();
    }
}

els.libTabLiked.onclick = showLikedSongs;
els.libTabPlaylists.onclick = showPlaylists;

function showLikedSongs() {
    currentLibTab = 'liked';
    els.libTabLiked.classList.remove('text-gray-500', 'border-transparent');
    els.libTabLiked.classList.add('text-white', 'border-gold-400');
    els.libTabPlaylists.classList.add('text-gray-500', 'border-transparent');
    els.libTabPlaylists.classList.remove('text-white', 'border-gold-400');

    els.libContentLiked.classList.remove('hidden');
    els.libContentPlaylists.classList.add('hidden');
    els.btnCreatePlaylist.classList.add('hidden');

    renderLibrary();
}

function showPlaylists() {
    currentLibTab = 'playlists';
    els.libTabPlaylists.classList.remove('text-gray-500', 'border-transparent');
    els.libTabPlaylists.classList.add('text-white', 'border-gold-400');
    els.libTabLiked.classList.add('text-gray-500', 'border-transparent');
    els.libTabLiked.classList.remove('text-white', 'border-gold-400');

    els.libContentLiked.classList.add('hidden');
    els.libContentPlaylists.classList.remove('hidden');
    els.btnCreatePlaylist.classList.remove('hidden');

    renderPlaylists();
}

function initPlaylists() { }

function renderPlaylists() {
    els.playlistList.innerHTML = '';
    if (savedPlaylists.length === 0) {
        els.emptyPlaylistMsg.classList.remove('hidden');
        return;
    }
    els.emptyPlaylistMsg.classList.add('hidden');

    savedPlaylists.forEach(pl => {
        const div = document.createElement('div');
        div.className = 'bg-transparent group cursor-pointer';

        const coverImg = pl.songs.length > 0 ? pl.songs[0].imageUrl : 'https://via.placeholder.com/300?text=Empty';

        div.innerHTML = `
            <div class="relative w-full aspect-square overflow-hidden bg-[#151515] mb-4 shadow-xl">
                <img src="${coverImg}" class="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 opacity-80 group-hover:opacity-100">
                <div class="absolute inset-0 border border-white/5 group-hover:border-gold-400/30 transition-colors"></div>
            </div>
            <div class="flex flex-col">
                <h3 class="font-serif text-lg text-white truncate w-full group-hover:text-gold-400 transition-colors">${pl.name}</h3>
                <p class="text-[10px] uppercase tracking-widest text-gray-500">${pl.songs.length} Tracks</p>
            </div>
        `;
        div.onclick = () => openPlaylistView(pl.id);
        els.playlistList.appendChild(div);
    });
}

function openPlaylistView(playlistId) {
    const pl = savedPlaylists.find(p => p.id === playlistId);
    if (!pl) return;

    currentOpenPlaylistId = playlistId;
    currentContext = 'playlist_view'; 

    // HIDE everything main
    els.libContentPlaylists.classList.add('hidden');
    els.libContentLiked.classList.add('hidden');
    els.btnCreatePlaylist.classList.add('hidden'); 
    els.playlistView.classList.remove('hidden');

    els.viewPlName.textContent = pl.name;
    els.viewPlCount.textContent = `${pl.songs.length} Tracks`;
    const coverImg = pl.songs.length > 0 ? pl.songs[0].imageUrl : 'https://via.placeholder.com/300?text=Empty';
    els.viewPlCover.src = coverImg;

    els.viewPlSongs.innerHTML = '';
    if (pl.songs.length === 0) {
        // Handle empty view logic if needed
    } else {
        pl.songs.forEach((item, index) => {
            const div = createSongElement(item, index, 'custom_playlist');
            els.viewPlSongs.appendChild(div);
        });
    }
}

function closePlaylistView() {
    els.playlistView.classList.add('hidden');

    // Restore Tab
    currentOpenPlaylistId = null;
    currentContext = 'library'; 
    
    // Re-open playlist tab
    showPlaylists();
}

els.btnPlayPlaylist.onclick = () => {
    if (!currentOpenPlaylistId) return;
    const pl = savedPlaylists.find(p => p.id === currentOpenPlaylistId);
    if (pl && pl.songs.length > 0) {
        playSong(pl.songs[0], 0, 'custom_playlist');
    } else {
        showToast("Empty Collection");
    }
};

els.btnDeletePlaylist.onclick = () => {
    if (!currentOpenPlaylistId) return;
    if (confirm("Delete this collection?")) {
        savedPlaylists = savedPlaylists.filter(p => p.id !== currentOpenPlaylistId);
        localStorage.setItem('ztune_playlists', JSON.stringify(savedPlaylists));
        closePlaylistView();
        renderPlaylists();
        showToast("Collection Deleted");
    }
};

els.btnCreatePlaylist.onclick = () => {
    els.playlistModal.classList.remove('hidden');
    els.playlistNameInput.focus();
};

els.closePlaylistModal.onclick = () => {
    els.playlistModal.classList.add('hidden');
    els.playlistNameInput.value = '';
};

els.savePlaylistBtn.onclick = () => {
    const name = els.playlistNameInput.value.trim();
    if (name) {
        const newPlaylist = {
            id: Date.now(),
            name: name,
            createdAt: new Date().toISOString(),
            songs: []
        };
        savedPlaylists.push(newPlaylist);
        localStorage.setItem('ztune_playlists', JSON.stringify(savedPlaylists));

        renderPlaylists();
        els.playlistModal.classList.add('hidden');
        els.playlistNameInput.value = '';
        showToast("Collection Created");
    }
};

els.tabSearch.onclick = () => switchTab('search');
els.tabLibrary.onclick = () => switchTab('library');
els.tabHistory.onclick = () => switchTab('history');

async function triggerSearch(query, btnElement) {
    if(activeLoadingBtn) {
        // Reset previous btn
        const prevIcon = activeLoadingBtn.querySelector('.mood-icon');
        if(prevIcon) {
            prevIcon.innerHTML = originalIconHTML;
            prevIcon.classList.add('group-hover:scale-110');
        }
    }
    if(btnElement) {
        activeLoadingBtn = btnElement;
        const iconSpan = btnElement.querySelector('.mood-icon');
        if(iconSpan) {
            originalIconHTML = iconSpan.innerHTML; 
            iconSpan.innerHTML = `<svg class="w-8 h-8 text-gold-400 loading-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
            iconSpan.classList.remove('group-hover:scale-110');
        }
    }
    await new Promise(r => setTimeout(r, 600));
    performSearch(query);
    els.contentArea.scrollTop = 0;
}

els.searchToggle.addEventListener('click', () => {
    isSearchVisible = !isSearchVisible;
    if (isSearchVisible) {
        switchTab('search');
        els.searchContainer.classList.remove('hidden');
        els.searchInput.focus();
    } else {
        els.searchContainer.classList.add('hidden');
        if (searchResults.length === 0) els.exploreArea.classList.remove('hidden');
        else els.resultsArea.classList.remove('hidden');
    }
});

els.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = els.searchInput.value.trim();
    if(!q) return;
    els.searchIconWrapper.innerHTML = `<svg class="w-5 h-5 text-gold-400 loading-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    performSearch(q);
});

async function performSearch(q) {
    showMsg('Seeking...', false);
    els.resultsArea.classList.add('hidden'); 
    els.libraryArea.classList.add('hidden');
    els.historyArea.classList.add('hidden');

    els.tabSearch.click(); 

    try {
        const res = await fetch(API_SEARCH + encodeURIComponent(q));
        const data = await res.json();

        if(data.status && data.result && data.result.length > 0) {
            const valid = data.result.filter(i => i.title && i.link).slice(0, 20);
            searchResults = valid; 
            playlist = valid; 
            displayResults(valid);
        } else {
            showMsg('Void returned nothing.', true);
            resetLoadingUI();
            els.exploreArea.classList.remove('hidden'); 
        }
    } catch (err) {
        showMsg('Connection lost.', true);
        resetLoadingUI();
        els.exploreArea.classList.remove('hidden');
    }
    els.searchIconWrapper.innerHTML = originalSearchIconHTML;
}

function resetLoadingUI() {
    if(activeLoadingBtn) {
        const iconSpan = activeLoadingBtn.querySelector('.mood-icon');
        if(iconSpan) {
            iconSpan.innerHTML = originalIconHTML;
            iconSpan.classList.add('group-hover:scale-110');
        }
        activeLoadingBtn = null;
    }
}

function displayResults(items) {
    showMsg('', false);
    els.exploreArea.classList.add('hidden');
    resetLoadingUI(); 
    els.libraryArea.classList.add('hidden');
    els.historyArea.classList.add('hidden');
    els.resultsArea.classList.remove('hidden');
    els.resultsArea.innerHTML = '';
    
    items.forEach((item, index) => {
        const div = createSongElement(item, index, 'search');
        els.resultsArea.appendChild(div);
    });
}

function createSongElement(item, index, context) {
    const div = document.createElement('div');
    div.className = 'song-card';
    div.innerHTML = `
        <div class="song-img-container">
            <img src="${item.imageUrl}" class="song-img">
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black transform scale-75 group-hover:scale-100 transition-transform duration-500">
                    <svg class="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
            </div>
            <div class="absolute inset-0 border border-white/5 group-hover:border-white/20 transition-colors pointer-events-none"></div>
        </div>
        <div class="flex-1 min-w-0 flex flex-col justify-center">
            <h3 class="font-serif text-sm font-medium text-white truncate w-full group-hover:text-gold-400 transition-colors">${item.title}</h3>
            <p class="text-[10px] uppercase tracking-widest text-gray-500 truncate w-full mt-1">${item.channel || 'Artist'}</p>
        </div>
    `;
    div.onclick = () => playSong(item, index, context);
    return div;
}

function showToast(msg) {
    els.toastMsg.textContent = msg;
    els.toast.classList.remove('hidden');
    els.toast.classList.add('flex');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        els.toast.classList.add('hidden');
        els.toast.classList.remove('flex');
    }, 2000);
}

function toggleLike(song) {
    if (!song) return;
    const idx = favorites.findIndex(f => f.link === song.link);
    if (idx === -1) favorites.push(song);
    else favorites.splice(idx, 1);
    localStorage.setItem('ztune_likes', JSON.stringify(favorites));
    updateLikeButtonState(song);
    if (currentContext === 'library' && currentLibTab === 'liked') renderLibrary();
}

function updateLikeButtonState(song) {
    if(!song) return;
    const isLiked = favorites.some(f => f.link === song.link);
    const colorClass = isLiked ? 'text-red-500 scale-110' : 'text-gray-600 hover:text-white';
    els.fullLikeBtn.className = `transition-all duration-300 ${colorClass}`; 
    els.miniLikeBtn.className = `transition-all duration-300 focus:outline-none ${colorClass}`;
}

function addToHistory(song) {
    const idx = history.findIndex(h => h.link === song.link);
    if (idx !== -1) history.splice(idx, 1);
    history.unshift(song);
    if (history.length > 20) history.pop();
    localStorage.setItem('ztune_history', JSON.stringify(history));
    if (currentContext === 'history') renderHistory();
}

function clearHistory() {
    history = [];
    localStorage.removeItem('ztune_history');
    renderHistory();
}

function renderLibrary() {
    els.libraryList.innerHTML = '';
    if (favorites.length === 0) {
        els.emptyLibraryMsg.classList.remove('hidden');
        els.libraryList.classList.add('hidden'); 
    } else {
        els.emptyLibraryMsg.classList.add('hidden');
        els.libraryList.classList.remove('hidden'); 
        favorites.forEach((item, index) => {
            els.libraryList.appendChild(createSongElement(item, index, 'library'));
        });
    }
}

function renderHistory() {
    els.historyList.innerHTML = '';
    if (history.length === 0) {
        els.emptyHistoryMsg.classList.remove('hidden');
        return;
    }
    els.emptyHistoryMsg.classList.add('hidden');
    history.forEach((item, index) => {
        els.historyList.appendChild(createSongElement(item, index, 'history'));
    });
}

async function playSong(item, index, context) {
    if (context === 'library') playlist = [...favorites];
    else if (context === 'history') playlist = [...history];
    else if (context === 'search') playlist = searchResults;
    else if (context === 'quickpicks') playlist = quickPicks; 
    else if (context === 'shared') playlist = [item];
    else if (context === 'custom_playlist') {
        const pl = savedPlaylists.find(p => p.id === currentOpenPlaylistId);
        if(pl) playlist = pl.songs;
    }

    currentContext = context;
    currentSongIndex = index;
    addToHistory(item);

    openPlayerOverlay();
    
    // Initial Render
    els.pTitle.textContent = item.title;
    els.pArtist.textContent = item.channel || 'Loading...';
    els.pCover.src = item.imageUrl || 'https://via.placeholder.com/300';
    els.pBg.src = item.imageUrl || 'https://via.placeholder.com/300';
    els.miniTitle.textContent = item.title;
    els.miniArtist.textContent = item.channel;
    els.miniCover.src = item.imageUrl || 'https://via.placeholder.com/100';

    els.menuDownloadBtn.href = '#'; 

    checkMarquee(item.title);
    updateLikeButtonState(item);

    try {
        const res = await fetch(API_PLAY + encodeURIComponent(item.link));
        const data = await res.json();
        
        // Pengecekan data menggunakan format JSON baru (data.status dan download_url)
        if(data.status && data.result?.download_url) {
            const m = data.result;
            item.title = m.title || item.title;
            // Channel tidak ada di API baru, jadi tetap gunakan channel bawaan dari data pencarian
            item.channel = item.channel; 
            if(m.thumbnail) item.imageUrl = m.thumbnail;

            els.pTitle.textContent = item.title;
            els.pArtist.textContent = item.channel;
            els.pCover.src = item.imageUrl;
            els.pBg.src = item.imageUrl;
            els.miniTitle.textContent = item.title;
            els.miniArtist.textContent = item.channel;
            els.miniCover.src = item.imageUrl;

            checkMarquee(els.pTitle.textContent);
            addToHistory(item);
            els.menuDownloadBtn.href = m.download_url;

            els.audio.src = m.download_url;
            els.audio.volume = els.volSlider.value;
            playAudio();
        } else {
            console.error("Stream failed");
        }
    } catch (e) { 
        console.error(e); 
    }
}

function playAudio() { 
    els.audio.play().then(() => updatePlayIcons(true)).catch(e => console.log("Auto-play blocked")); 
}
function pauseAudio() { 
    els.audio.pause(); 
    updatePlayIcons(false); 
}
function updatePlayIcons(isPlaying) {
    if(isPlaying) {
        els.playIcon.classList.add('hidden'); els.pauseIcon.classList.remove('hidden');
        els.miniPlayIcon.classList.add('hidden'); els.miniPauseIcon.classList.remove('hidden');
    } else {
        els.playIcon.classList.remove('hidden'); els.pauseIcon.classList.add('hidden');
        els.miniPlayIcon.classList.remove('hidden'); els.miniPauseIcon.classList.add('hidden');
    }
}
els.playBtn.onclick = () => els.audio.paused ? playAudio() : pauseAudio();
els.miniPlayBtn.onclick = (e) => { e.stopPropagation(); els.audio.paused ? playAudio() : pauseAudio(); };
const handleLikeClick = (e) => { e.stopPropagation(); if (currentSongIndex !== -1 && playlist[currentSongIndex]) toggleLike(playlist[currentSongIndex]); };
els.fullLikeBtn.onclick = handleLikeClick;
els.miniLikeBtn.onclick = handleLikeClick;
els.audio.onended = () => { if (els.audio.loop) playAudio(); else playNextSong(); };
function playNextSong() { if (currentSongIndex < playlist.length - 1) playSong(playlist[currentSongIndex + 1], currentSongIndex + 1, currentContext); else updatePlayIcons(false); }
els.nextBtn.onclick = playNextSong;
els.prevBtn.onclick = () => { if(currentSongIndex > 0) playSong(playlist[currentSongIndex - 1], currentSongIndex - 1, currentContext); else els.audio.currentTime = 0; };

function openPlayerOverlay() { 
    els.miniPlayer.classList.add('translate-y-[150%]');
    els.miniPlayer.classList.add('hidden'); 
    els.playerOverlay.classList.remove('translate-y-[100%]');
    document.body.style.overflow = 'hidden'; 
}
function closePlayerOverlay() { 
    els.optionsMenu.classList.add('hidden'); 
    els.playerOverlay.classList.add('translate-y-[100%]');
    document.body.style.overflow = 'auto'; 
    if(els.audio.src) { 
        els.miniPlayer.classList.remove('hidden'); 
        setTimeout(() => els.miniPlayer.classList.remove('translate-y-[150%]'), 100); 
    } 
}
els.closePlayerBtn.onclick = closePlayerOverlay;
els.miniPlayer.onclick = (e) => { if(!e.target.closest('button')) openPlayerOverlay(); };
function checkMarquee(text) { els.pTitle.classList.remove('animate-scroll'); setTimeout(() => { if (els.pTitle.scrollWidth > els.marqueeWrapper.clientWidth) els.pTitle.classList.add('animate-scroll'); }, 100); }
els.loopBtn.onclick = () => { els.audio.loop = !els.audio.loop; els.loopDot.classList.toggle('hidden', !els.audio.loop); els.loopBtn.classList.toggle('text-white', els.audio.loop); };
els.volSlider.oninput = (e) => els.audio.volume = e.target.value;
els.audio.ontimeupdate = () => { const curr = els.audio.currentTime; const dur = els.audio.duration; if(dur) { els.progFill.style.width = (curr / dur) * 100 + '%'; els.currTime.textContent = fmtTime(curr); els.durTime.textContent = fmtTime(dur); } };
els.progCont.onclick = (e) => { const dur = els.audio.duration; if(dur) els.audio.currentTime = ((e.clientX - els.progCont.getBoundingClientRect().left) / els.progCont.getBoundingClientRect().width) * dur; };
function fmtTime(s) { if(isNaN(s)) return "0:00"; const m = Math.floor(s / 60), sec = Math.floor(s % 60); return `${m}:${sec < 10 ? '0' : ''}${sec}`; }
function showMsg(text, isError) { els.msgArea.textContent = text; els.msgArea.className = `text-center text-xs uppercase tracking-widest font-medium py-10 transition-all ${isError ? 'text-red-500' : 'text-gray-500'} ${text ? '' : 'hidden'}`; }
function setGreeting() { const h = new Date().getHours(); document.getElementById('greeting-text').textContent = h < 12 ? 'Morning Sonics.' : h < 18 ? 'Afternoon Flow.' : 'Evening Luxury.'; }
setGreeting();
