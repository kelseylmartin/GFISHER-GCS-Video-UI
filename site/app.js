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
let globalCommonPrefixLen = 0; // Tracks the root path

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
}

// --- NEW SEARCH LOGIC ---
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    
    // 1. Search Filter: Only check the top-level directory directly below "2025" (or root)
    let searchedVideos = allVideos.filter(video => {
        if (!searchTerm) return true;
        // relPathArray[0] is the folder name directly below the root prefix
        const topFolder = video.relPathArray[0] ? video.relPathArray[0].toLowerCase() : "";
        return topFolder.includes(searchTerm);
    });

    // 2. Rebuild Directory Tree: Show only folders that matched the search
    // We pass true/false for isSearching to auto-expand folders if the user is typing
    buildFolderTree(searchedVideos, searchTerm !== "");

    // 3. Selection Filter: Check if the currently selected folder got hidden by the search
    const folderStillValid = searchedVideos.some(v => v.folderPath.startsWith(selectedFolder));
    if (!folderStillValid && selectedFolder !== "") {
        selectedFolder = ""; // Reset to "All Videos" if their folder vanished
    }

    filteredVideos = searchedVideos.filter(video => {
        return selectedFolder === "" || video.folderPath === selectedFolder || video.folderPath.startsWith(selectedFolder + '/');
    });

    currentPage = 1; 
    renderVideos();
    highlightSelectedFolder();
}

// --- UPDATED TREE LOGIC ---
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
                // If the user is actively searching, auto-expand the tree to show the results
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
    // Reset all buttons to default grey
    document.querySelectorAll('.folder-btn').forEach(btn => {
        btn.classList.remove('bg-blue-50', 'dark:bg-blue-900/30', 'text-blue-700', 'dark:text-blue-400', 'font-semibold');
        if(!btn.classList.contains('text-slate-600')) btn.classList.add('text-slate-600', 'dark:text-slate-400');
    });
    
    // Highlight the newly selected folder in blue
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
    
    // Change placeholder text dynamically to reflect new behavior
    searchInput.placeholder = "Search for a directory (e.g. NCD)...";

    if (typeof masterVideoData !== 'undefined' && Array.isArray(masterVideoData)) {
        document.getElementById('loadingState').classList.add('hidden');
        if (masterVideoData.length > 0) {
            allVideos = masterVideoData;
            
            // Calculate the common root prefix exactly ONCE to keep tree structure consistent
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
            
            applyFilters(); // This triggers the first tree build and video render
        } else { 
            document.getElementById('errorState').classList.remove('hidden'); 
        }
    }
    initVideoTools(); 
});

// Debounce the search input so it doesn't try to filter on every single keystroke instantly
let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 200);
});

// --- MULTI-SELECT & CARDS ---
window.toggleVideoSelection = function(cb) {
    if (cb.checked) selectedVideoUrls.add(cb.value);
    else selectedVideoUrls.delete(cb.value);
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
    if (selectedVideoUrls.size > 0) openVideoModal(Array.from(selectedVideoUrls));
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
                    <h3 class="font-semibold text-slate-800 dark:text-white text-lg
