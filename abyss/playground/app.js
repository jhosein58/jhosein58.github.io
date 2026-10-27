const INITIAL_CODE = `import print_cstr from "std/prelude"

main :: fn() {
    print_cstr(c"Welcome to the Abyss Playground!\\n")
    print_cstr(c"Compiled and executed entirely inside WebAssembly.\\n")
}
`;

let wasmModule = null;
const editor = document.getElementById("code-editor");
const lineNumbers = document.getElementById("line-numbers");
const output = document.getElementById("output");
const runBtn = document.getElementById("run-btn");
const clearBtn = document.getElementById("clear-btn");
const copyBtn = document.getElementById("copy-btn");
const statusPill = document.getElementById("status-pill");
const statusText = document.getElementById("status-text");
const execTime = document.getElementById("exec-time");

function updateLineNumbers() {
    const lines = editor.value.split("\n").length;
    let numbers = "";
    for (let i = 1; i <= lines; i++) {
        numbers += i + "\n";
    }
    lineNumbers.textContent = numbers;
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

async function loadWasm() {
    try {
        setStatus("loading", "Loading Wasm");
        runBtn.disabled = true;

        const response = await fetch("abyssc.wasm");
        if (!response.ok) {
            throw new Error(`Failed to load abyssc.wasm (${response.status})`);
        }

        const buffer = await response.arrayBuffer();
        wasmModule = await WebAssembly.compile(buffer);

        setStatus("ready", "Ready");
        runBtn.disabled = false;
    } catch (err) {
        setStatus("error", "Wasm Error");
        output.innerHTML = `<span class="ansi-red">Failed to initialize WebAssembly engine: ${escapeHtml(err.message)}</span>`;
    }
}

async function runCode() {
    if (!wasmModule) return;

    setStatus("running", "Running");
    runBtn.disabled = true;
    execTime.style.display = "none";

    let stdoutText = "";
    const decoder = new TextDecoder();

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

        const encoder = new TextEncoder();
        const codeBytes = encoder.encode(editor.value);
        const ptr = instance.exports.alloc_source_buffer(codeBytes.length + 1);
        const mem = new Uint8Array(instance.exports.memory.buffer);
        mem.set(codeBytes, ptr);
        mem[ptr + codeBytes.length] = 0;

        const t0 = performance.now();
        let exitCode = 0;
        try {
            exitCode = instance.exports.run_abyss(ptr, codeBytes.length);
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
    updateLineNumbers();
    updateEditorHighlight();
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
        updateLineNumbers();
        updateEditorHighlight();
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
updateLineNumbers();
updateEditorHighlight();
loadWasm();
