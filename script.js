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
let originalSearchIconHTML = els.searchIconWrapper ? els.searchIconWrapper.innerHTML : ''; 
let toastTimeout;
let currentOpenPlaylistId = null;

// --- INIT ---
window.addEventListener('DOMContentLoaded', () => {
    initQuickPicks();
    checkUrlParams();
    initPlaylists();
    if (currentLibTab === 'liked') showLikedSongs();
});

// --- API FETCH & PLAY LOGIC WITH BUFFER ---
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

    openPlayerOverlay();
    
    // UI Awal (Loading State)
    els.pTitle.textContent = item.title;
    els.pArtist.textContent = item.channel || 'Loading Artist...';
    els.pCover.src = item.imageUrl;
    els.pBg.src = item.imageUrl;
    els.miniTitle.textContent = item.title;
    els.miniArtist.textContent = item.channel;
    els.miniCover.src = item.imageUrl;

    checkMarquee(item.title);
    updateLikeButtonState(item);

    try {
        // Step 1: Ambil URL Downloader dari API
        const res = await fetch(API_PLAY + encodeURIComponent(item.link));
        const data = await res.json();
        
        if(data.status && data.result?.download_url) {
            const m = data.result;
            const finalAudioUrl = m.download_url;

            // Update Metadata dari API
            item.title = m.title || item.title;
            if(m.thumbnail) item.imageUrl = m.thumbnail;
            
            els.pTitle.textContent = item.title;
            els.miniTitle.textContent = item.title;
            els.menuDownloadBtn.href = finalAudioUrl;

            addToHistory(item);
            showToast("Buffering Audio...");

            // Step 2: Sistem Buffer (Mengatasi CORS/Hotlink Protection)
            try {
                // Gunakan Proxy AllOrigins untuk bypass blokir CORS server CDN
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(finalAudioUrl)}`;
                const audioRes = await fetch(proxyUrl);
                
                if (!audioRes.ok) throw new Error("Proxy failed");
                
                const blob = await audioRes.blob();
                const blobUrl = URL.createObjectURL(blob);

                // Masukkan ke Player
                els.audio.src = blobUrl;
                els.audio.volume = els.volSlider.value;
                playAudio();
                showToast("Now Playing");
            } catch (bufferErr) {
                console.warn("Buffer failed, trying direct stream...", bufferErr);
                // Fallback: Jika proxy/buffer gagal, coba langsung ke URL asli
                els.audio.src = finalAudioUrl;
                playAudio();
            }

        } else {
            showToast("Gagal mengambil data lagu.");
        }
    } catch (e) { 
        console.error("Play Error:", e);
        showToast("Koneksi bermasalah.");
    }
}

// --- CORE FUNCTIONS (SEARCH, UI, ETC) ---

function initQuickPicks() {
    if (history.length > 0) {
        const lastPlayed = history[0];
        const artist = lastPlayed.channel;
        if(artist && artist !== 'Artist') {
            fetch(API_SEARCH + encodeURIComponent(artist))
                .then(res => res.json())
                .then(data => {
                    if(data.status && data.result) {
                        quickPicks = data.result.filter(i => i.title && i.link).slice(0, 5); 
                        renderQuickPicks();
                    }
                }).catch(() => {});
        }
    }
}

function renderQuickPicks() {
    if(quickPicks.length === 0) return;
    els.quickPicksList.innerHTML = '';
    els.quickPicksContainer.classList.remove('hidden');
    quickPicks.forEach((item, index) => {
        els.quickPicksList.appendChild(createSongElement(item, index, 'quickpicks'));
    });
}

async function performSearch(q) {
    showMsg('Seeking...', false);
    els.resultsArea.classList.add('hidden'); 
    els.exploreArea.classList.add('hidden');

    try {
        const res = await fetch(API_SEARCH + encodeURIComponent(q));
        const data = await res.json();

        if(data.status && data.result?.length > 0) {
            searchResults = data.result.filter(i => i.title && i.link).slice(0, 20); 
            displayResults(searchResults);
        } else {
            showMsg('Void returned nothing.', true);
        }
    } catch (err) {
        showMsg('Connection lost.', true);
    }
    if (els.searchIconWrapper) els.searchIconWrapper.innerHTML = originalSearchIconHTML;
}

function displayResults(items) {
    showMsg('', false);
    els.exploreArea.classList.add('hidden');
    els.libraryArea.classList.add('hidden');
    els.historyArea.classList.add('hidden');
    els.resultsArea.classList.remove('hidden');
    els.resultsArea.innerHTML = '';
    items.forEach((item, index) => {
        els.resultsArea.appendChild(createSongElement(item, index, 'search'));
    });
}

function createSongElement(item, index, context) {
    const div = document.createElement('div');
    div.className = 'song-card';
    div.innerHTML = `
        <div class="song-img-container">
            <img src="${item.imageUrl}" class="song-img">
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black">
                    <svg class="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
            </div>
        </div>
        <div class="flex-1 min-w-0">
            <h3 class="font-serif text-sm text-white truncate group-hover:text-gold-400">${item.title}</h3>
            <p class="text-[10px] uppercase tracking-widest text-gray-500 truncate mt-1">${item.channel || 'Artist'}</p>
        </div>
    `;
    div.onclick = () => playSong(item, index, context);
    return div;
}

// --- AUDIO CONTROLS ---
function playAudio() { els.audio.play().then(() => updatePlayIcons(true)).catch(() => {}); }
function pauseAudio() { els.audio.pause(); updatePlayIcons(false); }
function updatePlayIcons(isPlaying) {
    if(isPlaying) {
        els.playIcon.classList.add('hidden'); els.pauseIcon.classList.remove('hidden');
        els.miniPlayIcon.classList.add('hidden'); els.miniPauseIcon.classList.remove('hidden');
    } else {
        els.playIcon.classList.remove('hidden'); els.pauseIcon.classList.add('hidden');
        els.miniPlayIcon.classList.remove('hidden'); els.miniPauseIcon.classList.add('hidden');
    }
}
function playNextSong() { if (currentSongIndex < playlist.length - 1) playSong(playlist[currentSongIndex + 1], currentSongIndex + 1, currentContext); }

els.playBtn.onclick = () => els.audio.paused ? playAudio() : pauseAudio();
els.miniPlayBtn.onclick = (e) => { e.stopPropagation(); els.audio.paused ? playAudio() : pauseAudio(); };
els.nextBtn.onclick = playNextSong;
els.prevBtn.onclick = () => { if(currentSongIndex > 0) playSong(playlist[currentSongIndex - 1], currentSongIndex - 1, currentContext); else els.audio.currentTime = 0; };
els.audio.onended = () => els.audio.loop ? playAudio() : playNextSong();

// --- UI UTILS ---
function showToast(msg) {
    els.toastMsg.textContent = msg;
    els.toast.classList.remove('hidden'); els.toast.classList.add('flex');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { els.toast.classList.add('hidden'); }, 2500);
}
function showMsg(text, isError) { 
    els.msgArea.textContent = text; 
    els.msgArea.className = `text-center text-xs tracking-widest py-10 ${isError ? 'text-red-500' : 'text-gray-500'} ${text ? '' : 'hidden'}`; 
}
function checkMarquee(text) { 
    els.pTitle.classList.remove('animate-scroll'); 
    setTimeout(() => { if (els.pTitle.scrollWidth > els.marqueeWrapper.clientWidth) els.pTitle.classList.add('animate-scroll'); }, 150); 
}
function updateLikeButtonState(song) {
    const isLiked = favorites.some(f => f.link === song.link);
    const colorClass = isLiked ? 'text-red-500' : 'text-gray-600';
    els.fullLikeBtn.className = `transition-all ${colorClass}`;
    els.miniLikeBtn.className = `transition-all ${colorClass}`;
}
function addToHistory(song) {
    history = [song, ...history.filter(h => h.link !== song.link)].slice(0, 20);
    localStorage.setItem('ztune_history', JSON.stringify(history));
}

// --- TABS & NAVIGATION ---
function switchTab(tab) {
    currentContext = tab;
    [els.tabSearch, els.tabLibrary, els.tabHistory].forEach(el => el.classList.remove('active'));
    if (tab === 'search') els.tabSearch.classList.add('active');
    else if (tab === 'library') els.tabLibrary.classList.add('active');
    else if (tab === 'history') els.tabHistory.classList.add('active');

    els.libraryArea.classList.add('hidden');
    els.historyArea.classList.add('hidden');
    els.exploreArea.classList.add('hidden');
    els.resultsArea.classList.add('hidden');
    els.playlistView.classList.add('hidden');

    if (tab === 'search') {
        if (searchResults.length > 0) els.resultsArea.classList.remove('hidden');
        else els.exploreArea.classList.remove('hidden');
    } else if (tab === 'library') {
        els.libraryArea.classList.remove('hidden');
        showLikedSongs();
    } else if (tab === 'history') {
        els.historyArea.classList.remove('hidden');
        renderHistory();
    }
}

els.tabSearch.onclick = () => switchTab('search');
els.tabLibrary.onclick = () => switchTab('library');
els.tabHistory.onclick = () => switchTab('history');

function showLikedSongs() {
    currentLibTab = 'liked';
    els.libContentLiked.classList.remove('hidden');
    els.libContentPlaylists.classList.add('hidden');
    renderLibrary();
}

function renderLibrary() {
    els.libraryList.innerHTML = '';
    if (favorites.length === 0) els.emptyLibraryMsg.classList.remove('hidden');
    else {
        els.emptyLibraryMsg.classList.add('hidden');
        favorites.forEach((item, index) => els.libraryList.appendChild(createSongElement(item, index, 'library')));
    }
}

function renderHistory() {
    els.historyList.innerHTML = '';
    if (history.length === 0) els.emptyHistoryMsg.classList.remove('hidden');
    else {
        els.emptyHistoryMsg.classList.add('hidden');
        history.forEach((item, index) => els.historyList.appendChild(createSongElement(item, index, 'history')));
    }
}

function openPlayerOverlay() { 
    els.miniPlayer.classList.add('hidden'); 
    els.playerOverlay.classList.remove('translate-y-[100%]');
    document.body.style.overflow = 'hidden'; 
}
els.closePlayerBtn.onclick = () => {
    els.playerOverlay.classList.add('translate-y-[100%]');
    document.body.style.overflow = 'auto';
    if(els.audio.src) els.miniPlayer.classList.remove('hidden');
};

// Search Form
els.searchForm.onsubmit = (e) => {
    e.preventDefault();
    const q = els.searchInput.value.trim();
    if(q) performSearch(q);
};

// Simple Time & Vol
els.volSlider.oninput = (e) => els.audio.volume = e.target.value;
els.audio.ontimeupdate = () => {
    const curr = els.audio.currentTime; const dur = els.audio.duration;
    if(dur) {
        els.progFill.style.width = (curr / dur) * 100 + '%';
        els.currTime.textContent = fmtTime(curr); els.durTime.textContent = fmtTime(dur);
    }
};
function fmtTime(s) { 
    const m = Math.floor(s / 60), sec = Math.floor(s % 60); 
    return `${m}:${sec < 10 ? '0' : ''}${sec}`; 
}

// Check Search Toggle
els.searchToggle.onclick = () => {
    isSearchVisible = !isSearchVisible;
    els.searchContainer.classList.toggle('hidden', !isSearchVisible);
    if(isSearchVisible) { switchTab('search'); els.searchInput.focus(); }
};

const setGreeting = () => { 
    const h = new Date().getHours(); 
    document.getElementById('greeting-text').textContent = h < 12 ? 'Morning Sonics.' : h < 18 ? 'Afternoon Flow.' : 'Evening Luxury.'; 
};
setGreeting();

function initPlaylists() {} // Placeholder for playlist logic
