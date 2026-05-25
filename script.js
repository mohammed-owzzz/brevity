const CONFIG = {
    HOST: "brevity-nvdo.onrender.com" 
};

let activeFile = null; 

const dropzone = document.getElementById('dropzoneLabel');
const fileInput = document.getElementById('pdfInput');
const inputCard = document.getElementById('inputCard');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    window.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
});

['dragenter', 'dragover'].forEach(eventName => {
    inputCard.addEventListener(eventName, () => dropzone.classList.add('dragover'));
});

['dragleave', 'drop'].forEach(eventName => {
    inputCard.addEventListener(eventName, () => dropzone.classList.remove('dragover'));
});

inputCard.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        activeFile = e.dataTransfer.files[0];
        document.getElementById('fileName').innerText = activeFile.name;
        document.getElementById('dropzoneLabel').innerText = "PDF Document Loaded";
        setBg('bg-loading');
    }
});

async function crossfade(hideIds, showIds) {
    const hideEls = hideIds.map(id => document.getElementById(id)).filter(el => el && el.style.display !== 'none');
    const showEls = showIds.map(id => document.getElementById(id)).filter(el => el && el.style.display === 'none');

    if (hideEls.length > 0) {
        hideEls.forEach(el => el.classList.add('fade-out'));
        await new Promise(r => setTimeout(r, 400)); 
        hideEls.forEach(el => el.style.display = 'none');
    }

    if (showEls.length > 0) {
        showEls.forEach(el => {
            el.style.display = (el.id === 'loader') ? 'flex' : 'block';
        });
        
        void document.body.offsetHeight; 
        
        showEls.forEach(el => el.classList.remove('fade-out'));
        await new Promise(r => setTimeout(r, 400));
    }
}

function closeModal() { 
    document.getElementById('errorModal').classList.remove('active');
    resetPage(); 
}

function showError(title, message) {
    document.getElementById('errorTitle').innerText = title;
    document.getElementById('errorMsg').innerText = message;
    document.getElementById('errorModal').classList.add('active');
}

function setBg(id) {
    document.querySelectorAll('.bg-layer').forEach(el => el.classList.remove('bg-active'));
    requestAnimationFrame(() => {
        document.getElementById(id).classList.add('bg-active');
    });
}

function updateFileName() {
    if (fileInput.files.length > 0) {
        activeFile = fileInput.files[0]; 
        document.getElementById('fileName').innerText = activeFile.name;
        document.getElementById('dropzoneLabel').innerText = "PDF Document Loaded";
        setBg('bg-loading');
    }
}

async function resetPage() {
    activeFile = null; 
    fileInput.value = '';
    document.getElementById('fileName').innerText = '';
    document.getElementById('dropzoneLabel').innerText = 'Click to select or drag PDF here';
    document.getElementById('dropzoneLabel').style.borderColor = "var(--border-color)";
    setBg('bg-default');

    await crossfade(['resultCard', 'navContainer', 'loader'], ['inputCard', 'summarizeBtn']);
}

async function summarizeFile() {
    if (!activeFile) {
        showError("System Initialization Failure", "No document detected within the ingestion buffer. Please verify the source file.");
        return;
    }

    if (activeFile.type !== "application/pdf" && !activeFile.name.toLowerCase().endsWith('.pdf')) {
        showError("Protocol Violation Detected", "Format mismatch. The Brevity engine strictly mandates PDF transport protocols.");
        return;
    }
    
    await crossfade(['summarizeBtn'], ['loader']);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); 

    try {
        const formData = new FormData();
        formData.append("file", activeFile); 
        
        const response = await fetch(`https://${CONFIG.HOST}/summarize`, { 
            method: "POST", 
            body: formData,
            signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error("Failed to fetch");
        
        const data = await response.json();
        
        if (data.status === "error") throw new Error("Data Ingestion Void: Document contains zero extractable character sequences.");
        
        const cleanText = data.summary
            .replace(/\*\*\*/g, '')
            .replace(/\*\*/g, '')
            .replace(/#/g, '')
            .replace(/- /g, '• ') 
            .trim();
        
        setBg('bg-success');
        
        document.getElementById('stats').innerHTML = `STATUS: <span>SUCCESS</span> | EXTRACTED: <span>${data.character_count.toLocaleString()} CHARS</span>`;
        document.getElementById('summaryText').innerText = cleanText;
        
        await crossfade(['inputCard'], ['resultCard', 'navContainer']);

    } catch (error) {
        clearTimeout(timeoutId);
        await resetPage();

        if (error.name === 'AbortError') {
            showError("System Timeout", "The Brevity engine failed to initialize within the expected timeframe.");
        }
        else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            showError("Engine Initialization Failed", "The processing unit failed to establish a handshake.");
        } 
        else if (error.message.includes(": ")) {
            const parts = error.message.split(": ");
            showError(parts[0], parts[1].trim());
        } 
        else {
            showError("System Error", error.message);
        }
    } 
}