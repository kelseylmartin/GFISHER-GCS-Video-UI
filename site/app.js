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
// Use an Array to guarantee selection order and manage numbers
let selectedVideoUrls = []; 
let globalCommonPrefixLen = 0; 

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
}

// --- SEARCH & FILTER LOGIC ---
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    
    let searchedVideos = allVideos.filter(video => {
        if (!searchTerm) return true;
        const topFolder = video.relPathArray[0] ? video.relPathArray[0].toLowerCase() : "";
        return topFolder.includes(searchTerm);
    });

    buildFolderTree(searchedVideos, searchTerm !== "");

    const folderStillValid = searchedVideos.some(v => v.folderPath.startsWith(selectedFolder));
    if (!folderStillValid && selectedFolder !== "") {
        selectedFolder = ""; 
    }

    filteredVideos = searchedVideos.filter(video => {
        return selectedFolder === "" || video.folderPath === selectedFolder || video.folderPath.startsWith(selectedFolder + '/');
    });

    currentPage = 1; 
    renderVideos();
    highlightSelectedFolder();
}

// --- TREE LOGIC ---
function buildFolderTree(videosToRender, isSearching) {
    if (videosToRender.length === 0) {
        folderListContainer.innerHTML = `<p class="p-4 text-sm text-slate-500 dark:text-slate-400">No directories match your search.</p>`;
        return;
    }

    let tree = { name: "Root", path: "", children: {}, isOpen: true };

    videosToRender.forEach(v => {
        let currentNode = tree;
        let currentPath = [];
        v.relPathArray.forEach(part => {
            currentPath.push(part);
            let pathStr = currentPath.join('/');
            if (!currentNode.children[part]) {
                currentNode.children[part] = { name: part, path: pathStr, children: {}, isOpen: isSearching ? true : false };
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
    applyFilters();
};

function highlightSelectedFolder() {
    document.querySelectorAll('.folder-btn').forEach(btn => {
        btn.classList.remove('bg-blue-50', 'dark:bg-blue-900/30', 'text-blue-700', 'dark:text-blue-400', 'font-semibold');
        if(!btn.classList.contains('text-slate-600')) btn.classList.add('text-slate-600', 'dark:text-slate-400');
    });
    
    const activeBtn = document.querySelector(`.folder-btn[data-path="${selectedFolder.replace(/"/g, '&quot;')}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-600', 'dark:text-slate-400');
        activeBtn.classList.add('bg-blue-50', 'dark:bg-blue-900/30', 'text-blue-700', 'dark:text-blue-400', 'font-semibold');
    }
}

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
    
    searchInput.placeholder = "Search for a directory (e.g. NCD)...";

    if (typeof masterVideoData !== 'undefined' && Array.isArray(masterVideoData)) {
        document.getElementById('loadingState').classList.add('hidden');
        if (masterVideoData.length > 0) {
            allVideos = masterVideoData;
            
            let minLen = Math.min(...allVideos.map(v => v.tiersArray.length));
            globalCommonPrefixLen = 0;
            for (let i = 0; i < minLen; i++) {
                if (allVideos.every(v => v.tiersArray[i] === allVideos[0].tiersArray[i])) globalCommonPrefixLen++;
                else break;
            }

            allVideos.forEach(v => {
                v.relPathArray = v.tiersArray.slice(globalCommonPrefixLen);
                v.folderPath = v.relPathArray.join('/');
            });

            filteredVideos = [...allVideos]; 
            searchInput.disabled = false;
            
            applyFilters(); 
        } else { 
            document.getElementById('errorState').classList.remove('hidden'); 
        }
    }
    initVideoTools(); 
});

let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 200);
});

// --- NEW SEQUENTIAL BADGE LOGIC ---
window.toggleVideoSelection = function(videoUrl) {
    const idx = selectedVideoUrls.indexOf(videoUrl);
    if (idx > -1) {
        // Deselecting: remove and update numbers for remaining selections
        selectedVideoUrls.splice(idx, 1);
    } else {
        // Selecting: add URL to the end of the selection order
        selectedVideoUrls.push(videoUrl);
    }
    updateSelectionBar();
    renderVideos(); // Refresh visual badges and numbers
};

window.clearSelection = function() {
    selectedVideoUrls = [];
    updateSelectionBar();
    renderVideos();
};

function updateSelectionBar() {
    if (selectedVideoUrls.length > 0) {
        selectionBar.classList.remove('hidden');
        selectionCount.textContent = `${selectedVideoUrls.length} Selected`;
    } else {
        selectionBar.classList.add('hidden');
    }
}

window.playSelectedVideos = function() {
    if (selectedVideoUrls.length > 0) openVideoModal(selectedVideoUrls);
};

// --- RENDER GRID WITH DYNAMIC NUMBERED BADGES ---
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
        // Determine selection index (click sequence order)
        const selectIndex = selectedVideoUrls.indexOf(video.url);
        const isSelected = selectIndex > -1;
        const displayPath = video.folderPath ? video.folderPath.replace(/\//g, " <span class='text-slate-300 dark:text-slate-600'>/</span> ") : "Root Directory";

        // Style change: Selection badge is always visible. Filled blue with a sequence number if clicked, empty circle if not.
        const badgeHtml = isSelected 
            ? `<div onclick="toggleVideoSelection('${video.url.replace(/'/g, "\\'")}')" class="absolute top-3 right-3 z-10 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-extrabold text-sm shadow-md cursor-pointer select-none transition-transform active:scale-95">${selectIndex + 1}</div>`
            : `<div onclick="toggleVideoSelection('${video.url.replace(/'/g, "\\'")}')" class="absolute top-3 right-3 z-10 w-7 h-7 border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95"></div>`;

        const cardHtml = `
            <div class="relative bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
                ${badgeHtml}
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
        rows = 'grid-rows-2'; 
    } else if (urls.length > 4 && urls.length <= 6) {
        cols = 'grid-cols-3';
        rows = 'grid-rows-2';
    } else if (urls.length > 6) {
        cols = 'grid-cols-3';
        rows = 'grid-rows-3';
    }

    multiVideoGrid.className = `w-full h-full origin-top-left transition-transform duration-100 ease-out grid ${cols} ${rows} gap-1 p-1`;

urls.forEach(url => {
        // Find the matching video object in our data to get the exact filename
        const videoObj = allVideos.find(v => v.url === url);
        const filename = videoObj ? videoObj.filename : decodeURIComponent(url.split('/').pop());

        // Create a wrapper to hold both the video and the label
        const wrapper = document.createElement('div');
        wrapper.className = 'relative w-full h-full bg-black rounded-lg border border-slate-800 overflow-hidden';

        // Create the video player
        const vid = document.createElement('video');
        vid.src = url;
        vid.controls = true;
        vid.muted = true; 
        vid.className = 'w-full h-full object-contain marine-video';
        
        // Create the floating filename label
        const label = document.createElement('div');
        label.className = 'absolute top-2 left-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded pointer-events-none z-10 font-mono shadow-sm backdrop-blur-sm truncate max-w-[90%]';
        label.textContent = filename;

        // Add them to the grid
        wrapper.appendChild(vid);
        wrapper.appendChild(label);
        multiVideoGrid.appendChild(wrapper);
    });

    videoModal.classList.remove('hidden');
    
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
