const grid = document.getElementById('videoGrid');
const searchInput = document.getElementById('searchInput');
const folderListContainer = document.getElementById('folderList');
const selectionBar = document.getElementById('selectionBar');
const selectionCount = document.getElementById('selectionCount');

let allVideos = [];
let filteredVideos = [];
let currentPage = 1;
const itemsPerPage = 12;
let selectedFolder = ""; 
let selectedVideoUrls = new Set(); 

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
}

function buildFolderTree() {
    if (allVideos.length === 0) return;

    let minLen = Math.min(...allVideos.map(v => v.tiersArray.length));
    let commonPrefixLen = 0;
    for (let i = 0; i < minLen; i++) {
        if (allVideos.every(v => v.tiersArray[i] === allVideos[0].tiersArray[i])) commonPrefixLen++;
        else break;
    }

    let tree = { name: "Root", path: "", children: {}, isOpen: true };

    allVideos.forEach(v => {
        v.relPathArray = v.tiersArray.slice(commonPrefixLen);
        v.folderPath = v.relPathArray.join('/');
        let currentNode = tree;
        let currentPath = [];
        v.relPathArray.forEach(part => {
            currentPath.push(part);
            let pathStr = currentPath.join('/');
            if (!currentNode.children[part]) {
                currentNode.children[part] = { name: part, path: pathStr, children: {}, isOpen: false };
            }
            currentNode = currentNode.children[part];
        });
    });

    folderListContainer.innerHTML = `
        <button data-path="" onclick="selectFolder('')" class="folder-btn w-full text-left px-3 py-2 rounded-lg mb-1 text-sm transition-colors bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2H4zm2 2h8v2H6V6z"></path></svg>
            All Videos
        </button>
    ` + renderTreeNode(tree, 0);
}

function renderTreeNode(node, depth) {
    let html = '';
    const padding = (depth * 1) + 0.5;
    const safeId = btoa(encodeURIComponent(node.path)).replace(/[^a-zA-Z0-9]/g, '');

    if (depth > 0) {
        const hasChildren = Object.keys(node.children).length > 0;
        const chevron = hasChildren ? `
            <svg id="icon-${safeId}" class="w-4 h-4 transition-transform ${node.isOpen ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        ` : `<span class="w-4 h-4 inline-block"></span>`;

        html += `
            <div class="flex items-center hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg mb-1 pr-2 cursor-pointer transition-colors" style="padding-left: ${padding}rem">
                <div onclick="toggleNode('${safeId}')" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    ${chevron}
                </div>
                <button data-path="${node.path.replace(/"/g, '&quot;')}" onclick="selectFolder('${node.path.replace(/'/g, "\\'")}')" class="folder-btn flex-1 text-left py-1.5 text-sm text-slate-600 dark:text-slate-400 truncate">
                    ${node.name}
                </button>
            </div>
        `;
    }

    if (Object.keys(node.children).length > 0) {
        html += `<div id="children-${safeId}" class="${node.isOpen || depth === 0 ? 'block' : 'hidden'}">`;
        Object.values(node.children).sort((a,b) => a.name.localeCompare(b.name)).forEach(child => {
            html += renderTreeNode(child, depth + 1);
        });
        html += `</div>`;
    }
    return html;
}

window.toggleNode = function(safeId) {
    const childrenDiv = document.getElementById(`children-${safeId}`);
    const icon = document.getElementById(`icon-${safeId}`);
    if (childrenDiv && icon) {
        const isHidden = childrenDiv.classList.contains('hidden');
        if (isHidden) {
            childrenDiv.classList.remove('hidden');
            icon.classList.add('rotate-90');
        } else {
            childrenDiv.classList.add('hidden');
            icon.classList.remove('rotate-90');
        }
    }
};

window.selectFolder = function(path) {
    selectedFolder = path;
    document.querySelectorAll('.folder-btn').forEach(btn => {
        btn.classList.remove('bg-blue-50', 'dark:bg-blue-900/30', 'text-blue-700', 'dark:text-blue-400', 'font-semibold');
    });
    const activeBtn = document.querySelector(`.folder-btn[data-path="${path.replace(/"/g, '&quot;')}"]`);
    if (activeBtn) {
        activeBtn.classList.add('bg-blue-50', 'dark:bg-blue-900/30', 'text-blue-700', 'dark:text-blue-400', 'font-semibold');
    }
    applyFilters();
};

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    filteredVideos = allVideos.filter(video => {
        let matchesFolder = selectedFolder === "" || video.folderPath === selectedFolder || video.folderPath.startsWith(selectedFolder + '/');
        let matchesSearch = !searchTerm || video.filename.toLowerCase().includes(searchTerm) || video.tiersArray.some(tier => tier.toLowerCase().includes(searchTerm));
        return matchesFolder && matchesSearch;
    });
    currentPage = 1; 
    renderVideos();
}

window.toggleVideoSelection = function(cb) {
    if (cb.checked) {
        selectedVideoUrls.add(cb.value);
    } else {
        selectedVideoUrls.delete(cb.value);
    }
    updateSelectionBar();
};

window.clearSelection = function() {
    selectedVideoUrls.clear();
    document.querySelectorAll('.video-checkbox').forEach(cb => cb.checked = false);
    updateSelectionBar();
};

function updateSelectionBar() {
    if (selectedVideoUrls.size > 0) {
        selectionBar.classList.remove('hidden');
        selectionCount.textContent = `${selectedVideoUrls.size} Selected`;
    } else {
        selectionBar.classList.add('hidden');
    }
}

window.playSelectedVideos = function() {
    if (selectedVideoUrls.size > 0) {
        openVideoModal(Array.from(selectedVideoUrls));
    }
};

function renderVideos() {
    grid.innerHTML = ''; 
    if (filteredVideos.length === 0) {
        grid.classList.add('hidden');
        document.getElementById('emptySearchState').classList.remove('hidden');
        return;
    }
    document.getElementById('emptySearchState').classList.add('hidden');
    grid.classList.remove('hidden');

    const pageVideos = filteredVideos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    pageVideos.forEach(video => {
        const isChecked = selectedVideoUrls.has(video.url) ? 'checked' : '';
        const displayPath = video.folderPath ? video.folderPath.replace(/\//g, " <span class='text-slate-300 dark:text-slate-600'>/</span> ") : "Root Directory";

        const cardHtml = `
            <div class="relative bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
                <div class="absolute top-3 right-3 z-10 bg-white/80 dark:bg-slate-800/80 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity ${isChecked ? 'opacity-100' : ''}">
                    <input type="checkbox" value="${video.url}" onchange="toggleVideoSelection(this)" ${isChecked} class="video-checkbox w-5 h-5 cursor-pointer accent-blue-600">
                </div>
                <div class="p-5 flex-grow">
                    <div class="text-xs font-mono text-slate-500 dark:text-slate-400 mb-2 truncate">${displayPath}</div>
                    <h3 class="font-semibold text-slate-800 dark:text-white text-lg mb-2 line-clamp-2">${video.filename}</h3>
                </div>
                <div class="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                    <button onclick="openVideoModal(['${video.url}'])" class="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" fill-rule="evenodd"></path></svg>
                        Play Solo
                    </button>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', cardHtml);
    });
    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
    const pc = document.getElementById('paginationControls');
    if (totalPages <= 1) { pc.classList.add('hidden'); return; }
    pc.classList.remove('hidden');
    let html = `<button onclick="goToPage(${currentPage - 1})" ${currentPage===1?'disabled':''} class="px-3 py-1.5 rounded-md border font-medium bg-white dark:bg-slate-800 dark:border-slate-700">Prev</button>`;
    for(let i=Math.max(1, currentPage-2); i<=Math.min(totalPages, currentPage+2); i++) {
        html += `<button onclick="goToPage(${i})" class="px-3 py-1.5 rounded-md border font-medium ${i===currentPage ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 dark:border-slate-700'}">${i}</button>`;
    }
    html += `<button onclick="goToPage(${currentPage + 1})" ${currentPage===totalPages?'disabled':''} class="px-3 py-1.5 rounded-md border font-medium bg-white dark:bg-slate-800 dark:border-slate-700">Next</button>`;
    pc.innerHTML = html;
}

window.goToPage = function(page) {
    currentPage = page; renderVideos();
    document.getElementById('mainScrollArea').scrollTo({ top: 0, behavior: 'smooth' }); 
};

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
    if (typeof masterVideoData !== 'undefined' && Array.isArray(masterVideoData)) {
        document.getElementById('loadingState').classList.add('hidden');
        if (masterVideoData.length > 0) {
            allVideos = masterVideoData;
            filteredVideos = [...allVideos]; 
            searchInput.disabled = false;
            buildFolderTree();
            renderVideos();
        } else { document.getElementById('errorState').classList.remove('hidden'); }
    }
    initVideoTools(); 
});

searchInput.addEventListener('input', () => {
    setTimeout(applyFilters, 250);
});

// --- MODAL & TOOLS ---
const videoModal = document.getElementById('videoModal');
const multiVideoGrid = document.getElementById('multiVideoGrid');

window.openVideoModal = function(urls) {
    multiVideoGrid.innerHTML = ''; 
    
    let cols = 'grid-cols-1';
    let rows = 'grid-rows-1';
    
    if (urls.length === 2) {
        cols = 'grid-cols-2';
        rows = 'grid-rows-1';
    } else if (urls.length === 3 || urls.length === 4) {
        cols = 'grid-cols-2';
        rows = 'grid-rows-2'; // Forces the rows to share the screen height perfectly
    } else if (urls.length > 4 && urls.length <= 6) {
        cols = 'grid-cols-3';
        rows = 'grid-rows-2';
    } else if (urls.length > 6) {
        cols = 'grid-cols-3';
        rows = 'grid-rows-3';
    }

    multiVideoGrid.className = `w-full h-full origin-top-left transition-transform duration-100 ease-out grid ${cols} ${rows} gap-1 p-1`;

    urls.forEach(url => {
        const vid = document.createElement('video');
        vid.src = url;
        vid.controls = true;
        vid.muted = true; 
        vid.className = 'w-full h-full object-contain bg-black marine-video border border-slate-800 rounded-lg';
        multiVideoGrid.appendChild(vid);
    });

    videoModal.classList.remove('hidden');
    
    // Sync Logic
    let syncLock = false;
    const syncCheckbox = document.getElementById('toolSync');
    const allVids = document.querySelectorAll('.marine-video');
    
    allVids.forEach(vid => {
        vid.addEventListener('play', (e) => {
            if(!syncCheckbox.checked || syncLock) return;
            syncLock = true;
            allVids.forEach(v => { if(v !== e.target) v.play(); });
            setTimeout(() => syncLock = false, 50);
            globalPlaying = true;
        });
        
        vid.addEventListener('pause', (e) => {
            if(!syncCheckbox.checked || syncLock) return;
            syncLock = true;
            allVids.forEach(v => { if(v !== e.target) v.pause(); });
            setTimeout(() => syncLock = false, 50);
            globalPlaying = false;
        });
        
        vid.addEventListener('seeked', (e) => {
            if(!syncCheckbox.checked || syncLock) return;
            syncLock = true;
            allVids.forEach(v => { if(v !== e.target) v.currentTime = e.target.currentTime; });
            setTimeout(() => syncLock = false, 50);
        });
    });

    allVids.forEach(vid => {
        vid.play().catch(e => console.log("Autoplay prevented:", e));
    });
};

window.closeVideoModal = function() {
    videoModal.classList.add('hidden');
    multiVideoGrid.innerHTML = ''; 
    resetVideoTools(); 
};

let globalPlaying = true;
window.globalPlayPause = function() {
    globalPlaying = !globalPlaying;
    document.querySelectorAll('.marine-video').forEach(vid => {
        if (globalPlaying) vid.play();
        else vid.pause();
    });
};

function initVideoTools() {
    const container = document.getElementById('vidContainer');
    const brightInput = document.getElementById('toolBrightness');
    const contrastInput = document.getElementById('toolContrast');
    const speedInput = document.getElementById('toolSpeed');
    const sharpenInput = document.getElementById('toolSharpen');

    function updateFilters() {
        let filterString = `brightness(${brightInput.value}) contrast(${contrastInput.value})`;
        if (sharpenInput.checked) filterString += ` url(#sharpen)`;
        document.querySelectorAll('.marine-video').forEach(vid => {
            vid.style.filter = filterString;
        });
    }

    brightInput.addEventListener('input', updateFilters);
    contrastInput.addEventListener('input', updateFilters);
    sharpenInput.addEventListener('change', updateFilters);

    speedInput.addEventListener('change', (e) => {
        document.querySelectorAll('.marine-video').forEach(vid => {
            vid.playbackRate = parseFloat(e.target.value);
        });
    });

    let scale = 1, panning = false, pointX = 0, pointY = 0, startX = 0, startY = 0;

    function setTransform() {
        multiVideoGrid.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    }

    window.resetVideoTools = function() {
        scale = 1; pointX = 0; pointY = 0; setTransform();
        brightInput.value = 1; contrastInput.value = 1;
        speedInput.value = "1"; sharpenInput.checked = false;
        document.getElementById('toolSync').checked = true;
        globalPlaying = true;
    };

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = -e.deltaY * 0.005;
        const newScale = Math.min(Math.max(1, scale + zoomFactor), 5); 
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        if (newScale !== scale) {
            pointX = mouseX - (mouseX - pointX) * (newScale / scale);
            pointY = mouseY - (mouseY - pointY) * (newScale / scale);
            scale = newScale;
            if (scale === 1) { pointX = 0; pointY = 0; }
            setTransform();
        }
    });

    container.addEventListener('mousedown', (e) => {
        if (scale > 1) {
            e.preventDefault();
            startX = e.clientX - pointX;
            startY = e.clientY - pointY;
            panning = true;
            container.style.cursor = 'grabbing';
        }
    });

    container.addEventListener('mousemove', (e) => {
        if (!panning) return;
        pointX = e.clientX - startX;
        pointY = e.clientY - startY;
        setTransform();
    });

    const stopPanning = () => { panning = false; container.style.cursor = 'grab'; };
    container.addEventListener('mouseup', stopPanning);
    container.addEventListener('mouseleave', stopPanning);
}
