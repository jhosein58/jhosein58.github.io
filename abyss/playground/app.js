const INITIAL_CODE = `import std.io: printf

main :: fn() {
    printf("Welcome to the Abyss Playground!\\n", .{})
    printf("Compiled and executed in-browser via WebAssembly.\\n", .{})
}
`;

AbyssEnv.configure({
    wasmPath: "abyssc.wasm"
});

const escapeHtml = AbyssEnv.escapeHtml;
const parseAnsi = AbyssEnv.parseAnsi;

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

async function loadWasm() {
    try {
        setStatus("loading", "Loading Wasm");
        runBtn.disabled = true;
        await AbyssEnv.load();
        setStatus("ready", "Ready");
        runBtn.disabled = false;
    } catch (err) {
        setStatus("error", "Error");
        output.innerHTML = `<span class="ansi-red">Failed to initialize WebAssembly engine: ${escapeHtml(err.message)}</span>`;
    }
}

async function runCode() {
    setStatus("running", "Running");
    runBtn.disabled = true;
    execTime.style.display = "none";

    try {
        const res = await AbyssEnv.run(editor.value);

        output.innerHTML = parseAnsi(res.rawOutput);
        execTime.textContent = `${res.elapsed} ms`;
        execTime.style.display = "inline-block";

        if (res.exitCode === 0) {
            setStatus("ready", "Ready");
        } else {
            setStatus("error", "Exit " + res.exitCode);
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
        updateLineNumbers();
        updateEditorHighlight();
        syncScroll();
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
