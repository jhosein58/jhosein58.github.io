const THEMES = {
  oled: {
    bg: "#000000",
    text: "#e5e5e5",
    comment: "#525252",
    str: "#a3a3a3",
    num: "#737373",
    op: "#525252",
    punct: "#525252",
    kw: "#ffffff",
    type: "#d4d4d4",
    self: "#d4d4d4",
    bool: "#d4d4d4",
    fn: "#f2f2f2",
    def: "#ffffff",
    member: "#d4d4d4",
    builtin: "#ffffff",
    macro: "#f2f2f2",
    ident: "#e5e5e5",
    flag: "#a3a3a3"
  },
  pastel: {
    bg: "#07080b",
    text: "#f1f5f9",
    comment: "#64748b",
    str: "#86efac",
    num: "#fdba74",
    op: "#c084fc",
    punct: "#64748b",
    kw: "#f472b6",
    type: "#93c5fd",
    self: "#c084fc",
    bool: "#fbcfe8",
    fn: "#fde047",
    def: "#ffffff",
    member: "#cbd5e1",
    builtin: "#38bdf8",
    macro: "#ec4899",
    ident: "#e2e8f0",
    flag: "#93c5fd"
  },
  deep: {
    bg: "#000000",
    text: "#e2e8f0",
    comment: "#475569",
    str: "#34d399",
    num: "#a78bfa",
    op: "#64748b",
    punct: "#475569",
    kw: "#38bdf8",
    type: "#818cf8",
    self: "#a855f7",
    bool: "#f472b6",
    fn: "#67e8f9",
    def: "#ffffff",
    member: "#94a3b8",
    builtin: "#38bdf8",
    macro: "#c084fc",
    ident: "#e2e8f0",
    flag: "#38bdf8"
  }
};

let ACTIVE_THEME = "oled";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getThemeCss(themeKeyOrObj) {
  const t = typeof themeKeyOrObj === "string" ? (THEMES[themeKeyOrObj] || THEMES.oled) : themeKeyOrObj;
  return ":root{" +
    "--abyss-tok-bg:" + t.bg + ";" +
    "--abyss-tok-text:" + t.text + ";" +
    "--abyss-tok-comment:" + t.comment + ";" +
    "--abyss-tok-str:" + t.str + ";" +
    "--abyss-tok-num:" + t.num + ";" +
    "--abyss-tok-op:" + t.op + ";" +
    "--abyss-tok-punct:" + t.punct + ";" +
    "--abyss-tok-kw:" + t.kw + ";" +
    "--abyss-tok-type:" + t.type + ";" +
    "--abyss-tok-self:" + t.self + ";" +
    "--abyss-tok-bool:" + t.bool + ";" +
    "--abyss-tok-fn:" + t.fn + ";" +
    "--abyss-tok-def:" + t.def + ";" +
    "--abyss-tok-member:" + t.member + ";" +
    "--abyss-tok-builtin:" + t.builtin + ";" +
    "--abyss-tok-macro:" + t.macro + ";" +
    "--abyss-tok-ident:" + t.ident + ";" +
    "--abyss-tok-flag:" + t.flag + ";" +
    "}" +
    ".tok-comment{color:var(--abyss-tok-comment);font-style:italic;}" +
    ".tok-str,.tok-string,.str{color:var(--abyss-tok-str);}" +
    ".tok-num,.tok-number,.num{color:var(--abyss-tok-num);}" +
    ".tok-kw,.tok-keyword,.kw{color:var(--abyss-tok-kw);font-weight:600;}" +
    ".tok-type,.ty{color:var(--abyss-tok-type);font-weight:500;}" +
    ".tok-self{color:var(--abyss-tok-self);font-weight:500;}" +
    ".tok-bool{color:var(--abyss-tok-bool);font-weight:500;}" +
    ".tok-fn,.fn{color:var(--abyss-tok-fn);}" +
    ".tok-def{color:var(--abyss-tok-def);font-weight:600;}" +
    ".tok-member,.tok-prop{color:var(--abyss-tok-member);}" +
    ".tok-builtin{color:var(--abyss-tok-builtin);font-weight:500;}" +
    ".tok-macro{color:var(--abyss-tok-macro);font-weight:500;}" +
    ".tok-op,.tok-operator,.op{color:var(--abyss-tok-op);}" +
    ".tok-punct{color:var(--abyss-tok-punct);}" +
    ".tok-ident{color:var(--abyss-tok-ident);}" +
    ".tok-flag{color:var(--abyss-tok-flag);}";
}

function injectTheme(themeKeyOrObj) {
  if (typeof document === "undefined") return;
  let styleEl = document.getElementById("abyss-syntax-theme");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "abyss-syntax-theme";
    const head = document.head || document.getElementsByTagName("head")[0];
    if (head) head.appendChild(styleEl);
  }
  styleEl.textContent = getThemeCss(themeKeyOrObj);
}

function setTheme(themeKeyOrObj) {
  if (typeof themeKeyOrObj === "string" && THEMES[themeKeyOrObj]) {
    ACTIVE_THEME = themeKeyOrObj;
  }
  injectTheme(themeKeyOrObj);
}

const ABYSS_KEYWORDS = new Set(["if","match","for","in","else","while","break","cont","ret","cmpt","fn","struct","enum","import","from","and","or","not","as"]);
const ABYSS_PRIMITIVES = new Set(["u8","u16","u32","u64","u128","usize","i8","i16","i32","i64","i128","isize","f16","f32","f64","f128","bool","type","Self"]);
const ABYSS_BOOLEANS = new Set(["true","false"]);

function highlightAbyss(code) {
  if (!code) return "";
  const pattern = [
    "--[^\\r\\n]*",
    "`(?:\\\\`|[^`])*`|c\"(?:\\\\.|[^\"\\\\])*\"|\"(?:\\\\.|[^\"\\\\])*\"|\\x27(?:\\\\.|[^\\x27\\\\])*\\x27",
    "#[a-zA-Z_][a-zA-Z0-9_]*|#(?=[`\"\\(])",
    "@[a-zA-Z_][a-zA-Z0-9_]*",
    "0[xX][0-9a-fA-F_]+|[0-9_]+\\.[0-9_]+(?:[eE][+-]?[0-9_]+)?|(?<=[\\s\\(,])\\.[0-9_]+|[0-9_]+",
    "::|:=|\\+=|-=|\\*=|/=|%=|&=|\\|=|\\^=|<<=|>>=|==|!=|<=|>=|<<|>>|->|\\.\\.|\\.|[+\\-*/%=&|^~<>!]",
    "[;,:#()\\[\\]{}]",
    "[a-zA-Z_][a-zA-Z0-9_]*",
    "\\s+",
    "."
  ].map(p => "(" + p + ")").join("|");

  const regex = new RegExp(pattern, "g");
  const tokens = [];
  let m;
  let prevToken = null;

  while ((m = regex.exec(code)) !== null) {
    const [full, comment, str, macro, builtin, num, op, punct, word, ws, other] = m;
    if (ws) {
      tokens.push({ type: "ws", value: ws });
      continue;
    }
    const tok = { raw: full };
    if (comment) tok.type = "comment";
    else if (str) tok.type = "str";
    else if (macro) tok.type = "macro";
    else if (builtin) tok.type = "builtin";
    else if (num) tok.type = "num";
    else if (op) tok.type = "op";
    else if (punct) tok.type = "punct";
    else if (word) {
      tok.type = "word";
      tok.word = word;
    } else {
      tok.type = "other";
    }
    tok.prev = prevToken;
    if (prevToken) prevToken.next = tok;
    prevToken = tok;
    tokens.push(tok);
  }

  let out = "";
  for (const t of tokens) {
    if (t.type === "ws") {
      out += t.value;
      continue;
    }
    if (t.type === "comment") out += "<span class=\"tok-comment\">" + escapeHtml(t.raw) + "</span>";
    else if (t.type === "str") out += "<span class=\"tok-str\">" + escapeHtml(t.raw) + "</span>";
    else if (t.type === "macro") out += "<span class=\"tok-macro\">" + escapeHtml(t.raw) + "</span>";
    else if (t.type === "builtin") out += "<span class=\"tok-builtin\">" + escapeHtml(t.raw) + "</span>";
    else if (t.type === "num") out += "<span class=\"tok-num\">" + escapeHtml(t.raw) + "</span>";
    else if (t.type === "op") out += "<span class=\"tok-op\">" + escapeHtml(t.raw) + "</span>";
    else if (t.type === "punct") out += "<span class=\"tok-punct\">" + escapeHtml(t.raw) + "</span>";
    else if (t.type === "word") {
      const w = t.word;
      const next = t.next;
      const prev = t.prev;
      if (ABYSS_KEYWORDS.has(w)) {
        out += "<span class=\"tok-kw\">" + escapeHtml(w) + "</span>";
      } else if (w === "self") {
        out += "<span class=\"tok-self\">" + escapeHtml(w) + "</span>";
      } else if (ABYSS_BOOLEANS.has(w)) {
        out += "<span class=\"tok-bool\">" + escapeHtml(w) + "</span>";
      } else if (ABYSS_PRIMITIVES.has(w)) {
        out += "<span class=\"tok-type\">" + escapeHtml(w) + "</span>";
      } else if (next && next.raw === "::") {
        const afterNext = next.next;
        if (afterNext && afterNext.raw === "fn") out += "<span class=\"tok-def\">" + escapeHtml(w) + "</span>";
        else if (afterNext && (afterNext.raw === "struct" || afterNext.raw === "enum")) out += "<span class=\"tok-type\">" + escapeHtml(w) + "</span>";
        else if (/^[A-Z]/.test(w)) out += "<span class=\"tok-type\">" + escapeHtml(w) + "</span>";
        else out += "<span class=\"tok-def\">" + escapeHtml(w) + "</span>";
      } else if (next && next.raw === ":=") {
        const afterNext = next.next;
        if (afterNext && afterNext.raw === "fn") out += "<span class=\"tok-def\">" + escapeHtml(w) + "</span>";
        else out += "<span class=\"tok-ident\">" + escapeHtml(w) + "</span>";
      } else if (next && next.raw === ":") {
        out += "<span class=\"tok-member\">" + escapeHtml(w) + "</span>";
      } else if (prev && prev.raw === ".") {
        if (next && next.raw === "(") out += "<span class=\"tok-fn\">" + escapeHtml(w) + "</span>";
        else out += "<span class=\"tok-member\">" + escapeHtml(w) + "</span>";
      } else if (next && next.raw === "(") {
        out += "<span class=\"tok-fn\">" + escapeHtml(w) + "</span>";
      } else if (/^[A-Z]/.test(w)) {
        out += "<span class=\"tok-type\">" + escapeHtml(w) + "</span>";
      } else {
        out += "<span class=\"tok-ident\">" + escapeHtml(w) + "</span>";
      }
    } else {
      out += escapeHtml(t.raw);
    }
  }
  return out;
}

function highlightShell(code) {
  if (!code) return "";
  const pattern = [
    "#[^\\r\\n]*",
    "\"(?:\\\\.|[^\"\\\\])*\"|\\x27(?:\\\\.|[^\\x27\\\\])*\\x27",
    "-[a-zA-Z0-9_\\-]+",
    "\\b(?:gcc|clang|cc|make|git|curl|echo|cat|cd|ls|mkdir|rm|cargo|rustc)\\b|\\./abyss\\b",
    "\\$[a-zA-Z_][a-zA-Z0-9_]*",
    "\\b[0-9]+\\b",
    "[|&;$><]",
    "\\s+",
    "."
  ].map(p => "(" + p + ")").join("|");

  const regex = new RegExp(pattern, "g");
  let out = "";
  let m;
  while ((m = regex.exec(code)) !== null) {
    const [full, comment, str, flag, cmd, variable, num, op, ws, other] = m;
    if (comment) out += "<span class=\"tok-comment\">" + escapeHtml(comment) + "</span>";
    else if (str) out += "<span class=\"tok-str\">" + escapeHtml(str) + "</span>";
    else if (flag) out += "<span class=\"tok-flag\">" + escapeHtml(flag) + "</span>";
    else if (cmd) out += "<span class=\"tok-fn\">" + escapeHtml(cmd) + "</span>";
    else if (variable) out += "<span class=\"tok-ident\">" + escapeHtml(variable) + "</span>";
    else if (num) out += "<span class=\"tok-num\">" + escapeHtml(num) + "</span>";
    else if (op) out += "<span class=\"tok-op\">" + escapeHtml(op) + "</span>";
    else if (ws) out += ws;
    else if (other) out += escapeHtml(other);
  }
  return out;
}

function highlight(code, lang) {
  const l = (lang || "").toLowerCase().trim();
  if (l === "abyss" || l === "a" || !l) return highlightAbyss(code);
  if (l === "sh" || l === "bash" || l === "shell") return highlightShell(code);
  return escapeHtml(code);
}

function highlightAll(root) {
  const base = root || (typeof document !== "undefined" ? document : null);
  if (!base) return;
  const elements = base.querySelectorAll("code[data-lang], code[class*=\"language-\"], pre > code, code[id^=\"code-\"]");
  elements.forEach(el => {
    if (el.hasAttribute("data-highlighted") || el.classList.contains("editor-code") || el.id === "editor-code") return;
    let lang = el.getAttribute("data-lang");
    if (!lang) {
      const cls = el.className || "";
      const match = cls.match(/language-([a-zA-Z0-9_\-]+)/);
      if (match) lang = match[1];
    }
    if (!lang) {
      if (el.closest(".code-container") || el.id.startsWith("code-")) lang = "abyss";
      else lang = "abyss";
    }
    const raw = el.textContent;
    el.innerHTML = highlight(raw, lang);
    el.setAttribute("data-highlighted", "true");
  });
}

if (typeof document !== "undefined") {
  injectTheme(ACTIVE_THEME);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => highlightAll());
  } else {
    highlightAll();
  }
}

const AbyssSyntax = {
  THEMES,
  get activeTheme() { return ACTIVE_THEME; },
  setTheme,
  injectTheme,
  highlight,
  highlightAbyss,
  highlightShell,
  highlightAll,
  escapeHtml
};

if (typeof window !== "undefined") {
  window.AbyssSyntax = AbyssSyntax;
  window.highlightAbyss = highlightAbyss;
  window.highlightShell = highlightShell;
  window.highlightCode = highlight;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = AbyssSyntax;
}
