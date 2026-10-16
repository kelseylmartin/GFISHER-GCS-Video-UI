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
        const hasChildren = Object.keys(node.children).length
