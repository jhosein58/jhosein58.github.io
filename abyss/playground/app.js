const INITIAL_CODE = `import std.io: printf

main :: fn() {
    printf("Welcome to the Abyss Playground!\\n", .{})
    printf("Compiled and executed in-browser with complete filesystem abstraction.\\n", .{})
}
`;

let wasmModule = null;
let vfsBundle = null;
let projectFiles = { "main.a": INITIAL_CODE };
let activeFileName = "main.a";

const editor = document.getElementById("code-editor");
const lineNumbers = document.getElementById("line-numbers");
const output = document.getElementById("output");
const runBtn = document.getElementById("run-btn");
const clearBtn = document.getElementById("clear-btn");
const copyBtn = document.getElementById("copy-btn");
const newFileBtn = document.getElementById("new-file-btn");
const statusPill = document.getElementById("status-pill");
const statusText = document.getElementById("status-text");
const execTime = document.getElementById("exec-time");
const tabsContainer = document.getElementById("tabs-container");

function updateLineNumbers() {
    const lines = editor.value.split("\n");
    const count = lines.length;
    let numbers = "";
    for (let i = 1; i <= count; i++) {
        numbers += i + "\n";
    }
    lineNumbers.textContent = numbers;
    lineNumbers.style.width = Math.max(44, (String(count).length * 8 + 20)) + "px";
}

function updateEditorHighlight() {
    const codeEl = document.getElementById("editor-code");
    if (codeEl && window.AbyssSyntax) {
        codeEl.innerHTML = window.AbyssSyntax.highlightAbyss(editor.value) + (editor.value.endsWith("\n") ? "\n" : "");
    }
}

function syncScroll() {
    lineNumbers.scrollTop = editor.scrollTop;
    const highlight = document.getElementById("editor-highlight");
    if (highlight) {
        highlight.scrollTop = editor.scrollTop;
        highlight.scrollLeft = editor.scrollLeft;
    }
}

function setStatus(status, text) {
    statusPill.className = "status-pill " + status;
    statusText.textContent = text;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function parseAnsi(text) {
    const colors = {
        "30": "ansi-black",
        "31": "ansi-red",
        "32": "ansi-green",
        "33": "ansi-yellow",
        "34": "ansi-blue",
        "35": "ansi-magenta",
        "36": "ansi-cyan",
        "37": "ansi-white"
    };

    let result = "";
    let i = 0;
    let activeTags = 0;

    while (i < text.length) {
        if (text.charCodeAt(i) === 27 && text[i + 1] === "[") {
            const end = text.indexOf("m", i + 2);
            if (end !== -1) {
                const codes = text.substring(i + 2, end).split(";");
                i = end + 1;

                if (codes.includes("0") || codes[0] === "") {
                    while (activeTags > 0) {
                        result += "</span>";
                        activeTags--;
                    }
                }

                let classes = [];
                for (const c of codes) {
                    if (c === "1") classes.push("ansi-bold");
                    if (colors[c]) classes.push(colors[c]);
                }

                if (classes.length > 0) {
                    result += `<span class="${classes.join(" ")}">`;
                    activeTags++;
                }
                continue;
            }
        }
        result += escapeHtml(text[i]);
        i++;
    }

    while (activeTags > 0) {
        result += "</span>";
        activeTags--;
    }

    return result;
}

function renderTabs() {
    tabsContainer.innerHTML = "";
    for (const fileName of Object.keys(projectFiles)) {
        const tab = document.createElement("div");
        tab.className = "tab-item" + (fileName === activeFileName ? " active" : "");
        tab.textContent = fileName;
        if (fileName !== "main.a") {
            const close = document.createElement("span");
            close.className = "tab-close";
            close.textContent = "✕";
            close.title = "Delete file";
            close.onclick = (e) => {
                e.stopPropagation();
                delete projectFiles[fileName];
                if (activeFileName === fileName) {
                    activeFileName = "main.a";
                }
                renderTabs();
                switchFile(activeFileName);
            };
            tab.appendChild(close);
        }
        tab.onclick = () => switchFile(fileName);
        tabsContainer.appendChild(tab);
    }
}

function switchFile(fileName) {
    if (projectFiles[activeFileName] !== undefined) {
        projectFiles[activeFileName] = editor.value;
    }
    activeFileName = fileName;
    editor.value = projectFiles[activeFileName] || "";
    renderTabs();
    updateLineNumbers();
    updateEditorHighlight();
    syncScroll();
}

async function loadWasm() {
    try {
        setStatus("loading", "Loading Wasm");
        runBtn.disabled = true;

        const [wasmRes, bundleRes] = await Promise.all([
            fetch("abyssc.wasm"),
            fetch("vfs_bundle.json")
        ]);

        if (!wasmRes.ok) throw new Error(`Failed to load abyssc.wasm (${wasmRes.status})`);
        if (!bundleRes.ok) throw new Error(`Failed to load vfs_bundle.json (${bundleRes.status})`);

        const wasmBuffer = await wasmRes.arrayBuffer();
        vfsBundle = await bundleRes.json();
        wasmModule = await WebAssembly.compile(wasmBuffer);

        setStatus("ready", "Ready");
        runBtn.disabled = false;
    } catch (err) {
        setStatus("error", "Error");
        output.innerHTML = `<span class="ansi-red">Failed to initialize WebAssembly engine: ${escapeHtml(err.message)}</span>`;
    }
}

function mountVfs(instance, enc) {
    if (vfsBundle) {
        for (const [path, content] of Object.entries(vfsBundle)) {
            const pBytes = enc.encode(path + "\0");
            const dBytes = enc.encode(content);
            const pPtr = instance.exports.alloc_source_buffer(pBytes.length);
            const dPtr = instance.exports.alloc_source_buffer(dBytes.length);
            new Uint8Array(instance.exports.memory.buffer).set(pBytes, pPtr);
            new Uint8Array(instance.exports.memory.buffer).set(dBytes, dPtr);
            instance.exports.abyss_vfs_write(pPtr, dPtr, dBytes.length);
        }
    }

    for (const [path, content] of Object.entries(projectFiles)) {
        const pBytes = enc.encode(path + "\0");
        const dBytes = enc.encode(content);
        const pPtr = instance.exports.alloc_source_buffer(pBytes.length);
        const dPtr = instance.exports.alloc_source_buffer(dBytes.length);
        new Uint8Array(instance.exports.memory.buffer).set(pBytes, pPtr);
        new Uint8Array(instance.exports.memory.buffer).set(dBytes, dPtr);
        instance.exports.abyss_vfs_write(pPtr, dPtr, dBytes.length);
    }
}

async function runCode() {
    if (!wasmModule) return;

    if (projectFiles[activeFileName] !== undefined) {
        projectFiles[activeFileName] = editor.value;
    }

    setStatus("running", "Running");
    runBtn.disabled = true;
    execTime.style.display = "none";

    let stdoutText = "";
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    try {
        let instance;
        const imports = {
            env: {
                js_print_bytes: (ptr, len) => {
                    const bytes = new Uint8Array(instance.exports.memory.buffer, ptr, len);
                    stdoutText += decoder.decode(bytes);
                },
                js_trap: () => {
                    throw new Error("abyss_trap");
                }
            }
        };

        instance = new WebAssembly.Instance(wasmModule, imports);
        mountVfs(instance, encoder);

        const mBytes = encoder.encode("main.a\0");
        const mPtr = instance.exports.alloc_source_buffer(mBytes.length);
        new Uint8Array(instance.exports.memory.buffer).set(mBytes, mPtr);

        const t0 = performance.now();
        let exitCode = 0;
        try {
            exitCode = instance.exports.run_abyss_file(mPtr, 6);
        } catch (trapErr) {
            if (trapErr.message !== "abyss_trap") {
                stdoutText += `\nRuntime error: ${trapErr.message}\n`;
            }
            exitCode = 1;
        }
        const t1 = performance.now();
        const elapsed = (t1 - t0).toFixed(1);

        output.innerHTML = parseAnsi(stdoutText);
        execTime.textContent = `${elapsed} ms`;
        execTime.style.display = "inline-block";

        if (exitCode === 0) {
            setStatus("ready", "Ready");
        } else {
            setStatus("error", "Exit " + exitCode);
        }
    } catch (err) {
        output.innerHTML = `<span class="ansi-red">Execution error: ${escapeHtml(err.message)}</span>`;
        setStatus("error", "Error");
    } finally {
        runBtn.disabled = false;
    }
}

editor.addEventListener("input", () => {
    projectFiles[activeFileName] = editor.value;
    updateLineNumbers();
    updateEditorHighlight();
    syncScroll();
});
editor.addEventListener("scroll", syncScroll);

editor.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode();
        return;
    }

    if (e.key === "Tab") {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
        projectFiles[activeFileName] = editor.value;
        updateLineNumbers();
        updateEditorHighlight();
        syncScroll();
    }
});

newFileBtn.addEventListener("click", () => {
    const name = prompt("Enter file name (e.g. math.a, pod.json):");
    if (name && name.trim()) {
        const cleanName = name.trim();
        if (!projectFiles[cleanName]) {
            projectFiles[cleanName] = "";
        }
        switchFile(cleanName);
    }
});

copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(editor.value).then(() => {
        const originalTitle = copyBtn.getAttribute("title");
        copyBtn.setAttribute("title", "Copied!");
        setTimeout(() => copyBtn.setAttribute("title", originalTitle), 1500);
    });
});

clearBtn.addEventListener("click", () => {
    output.textContent = "";
    execTime.style.display = "none";
});

runBtn.addEventListener("click", runCode);

editor.value = INITIAL_CODE;
renderTabs();
updateLineNumbers();
updateEditorHighlight();
loadWasm();
