(function(global) {
  'use strict';

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function stripAnsi(text) {
    return (text || '').replace(/\u001b\[[0-9;]*m/g, '');
  }

  function parseAnsi(text) {
    if (!text) return '';
    const colors = {
      '30': 'ansi-black',
      '31': 'ansi-red',
      '32': 'ansi-green',
      '33': 'ansi-yellow',
      '34': 'ansi-blue',
      '35': 'ansi-magenta',
      '36': 'ansi-cyan',
      '37': 'ansi-white'
    };

    let result = '';
    let i = 0;
    let activeTags = 0;

    while (i < text.length) {
      if (text.charCodeAt(i) === 27 && text[i + 1] === '[') {
        const end = text.indexOf('m', i + 2);
        if (end !== -1) {
          const codes = text.substring(i + 2, end).split(';');
          i = end + 1;

          if (codes.includes('0') || codes[0] === '') {
            while (activeTags > 0) {
              result += '</span>';
              activeTags--;
            }
          }

          const classes = [];
          for (const c of codes) {
            if (c === '1') classes.push('ansi-bold');
            if (colors[c]) classes.push(colors[c]);
          }

          if (classes.length > 0) {
            result += '<span class="' + classes.join(' ') + '">';
            activeTags++;
          }
          continue;
        }
      }
      result += escapeHtml(text[i]);
      i++;
    }

    while (activeTags > 0) {
      result += '</span>';
      activeTags--;
    }

    return result;
  }

  const AbyssEnv = {
    wasmPath: 'playground/abyssc.wasm',
    vfsPath: 'playground/vfs_bundle.json',
    wasmModule: null,
    vfsBundle: null,
    vfsEncoded: null,
    loadPromise: null,
    encoder: new TextEncoder(),
    decoder: new TextDecoder(),

    configure: function(opts) {
      if (!opts) return;
      if (opts.wasmPath) this.wasmPath = opts.wasmPath;
      if (opts.vfsPath) this.vfsPath = opts.vfsPath;
    },

    isReady: function() {
      return this.wasmModule !== null && this.vfsEncoded !== null;
    },

    load: function() {
      if (this.wasmModule && this.vfsEncoded) {
        return Promise.resolve({ mod: this.wasmModule, vfs: this.vfsBundle });
      }
      if (this.loadPromise) return this.loadPromise;

      const self = this;
      this.loadPromise = (async function() {
        const wasmPromise = (async () => {
          try {
            if (typeof WebAssembly.compileStreaming === 'function') {
              return await WebAssembly.compileStreaming(fetch(self.wasmPath));
            }
          } catch (_) {}
          const res = await fetch(self.wasmPath);
          if (!res.ok) throw new Error('Failed to load WebAssembly binary (' + res.status + ')');
          const buf = await res.arrayBuffer();
          return await WebAssembly.compile(buf);
        })();

        const bundlePromise = (async () => {
          const res = await fetch(self.vfsPath);
          if (!res.ok) throw new Error('Failed to load VFS bundle (' + res.status + ')');
          return await res.json();
        })();

        const [mod, bundle] = await Promise.all([wasmPromise, bundlePromise]);

        const preEncoded = [];
        for (const [path, content] of Object.entries(bundle)) {
          preEncoded.push({
            pathBytes: self.encoder.encode(path + '\0'),
            dataBytes: self.encoder.encode(content)
          });
        }

        self.wasmModule = mod;
        self.vfsBundle = bundle;
        self.vfsEncoded = preEncoded;
        return { mod: mod, vfs: bundle };
      })().catch(function(err) {
        self.loadPromise = null;
        throw err;
      });

      return this.loadPromise;
    },

    run: async function(code, options) {
      options = options || {};
      await this.load();

      let stdoutText = '';
      let trapped = false;
      const self = this;

      const imports = {
        env: {
          js_print_bytes: function(ptr, len) {
            const bytes = new Uint8Array(instance.exports.memory.buffer, ptr, len);
            stdoutText += self.decoder.decode(bytes);
          },
          js_trap: function() {
            trapped = true;
            throw new Error('abyss_trap');
          }
        }
      };

      const instance = new WebAssembly.Instance(this.wasmModule, imports);

      for (let i = 0; i < this.vfsEncoded.length; i++) {
        const item = this.vfsEncoded[i];
        const pPtr = instance.exports.alloc_source_buffer(item.pathBytes.length);
        const dPtr = instance.exports.alloc_source_buffer(item.dataBytes.length);
        const mem = new Uint8Array(instance.exports.memory.buffer);
        mem.set(item.pathBytes, pPtr);
        mem.set(item.dataBytes, dPtr);
        instance.exports.abyss_vfs_write(pPtr, dPtr, item.dataBytes.length);
      }

      if (options.files) {
        const entryFile = options.entry || 'main.a';
        for (const [p, c] of Object.entries(options.files)) {
          if (p === entryFile) continue;
          const pBytes = this.encoder.encode(p + '\0');
          const dBytes = this.encoder.encode(c);
          const pPtr = instance.exports.alloc_source_buffer(pBytes.length);
          const dPtr = instance.exports.alloc_source_buffer(dBytes.length);
          const mem = new Uint8Array(instance.exports.memory.buffer);
          mem.set(pBytes, pPtr);
          mem.set(dBytes, dPtr);
          instance.exports.abyss_vfs_write(pPtr, dPtr, dBytes.length);
        }
      }

      const cleanCode = (code || '').replace(/\u00A0/g, ' ').replace(/\r\n/g, '\n');
      const entryName = options.entry || 'main.a';
      const pBytes = this.encoder.encode(entryName + '\0');
      const cBytes = this.encoder.encode(cleanCode);
      const pPtr = instance.exports.alloc_source_buffer(pBytes.length);
      const cPtr = instance.exports.alloc_source_buffer(cBytes.length);
      const mem = new Uint8Array(instance.exports.memory.buffer);
      mem.set(pBytes, pPtr);
      mem.set(cBytes, cPtr);
      instance.exports.abyss_vfs_write(pPtr, cPtr, cBytes.length);

      const t0 = performance.now();
      let exitCode = 0;
      try {
        exitCode = instance.exports.run_abyss_file(pPtr, pBytes.length - 1);
      } catch (err) {
        if (!trapped && err.message !== 'abyss_trap') {
          stdoutText += '\nRuntime error: ' + err.message + '\n';
        }
        exitCode = 1;
      }
      const elapsed = parseFloat((performance.now() - t0).toFixed(1));

      return {
        exitCode: exitCode,
        output: stripAnsi(stdoutText).trim(),
        rawOutput: stdoutText,
        elapsed: elapsed
      };
    },

    escapeHtml: escapeHtml,
    stripAnsi: stripAnsi,
    parseAnsi: parseAnsi
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AbyssEnv;
  }
  if (typeof window !== 'undefined') {
    window.AbyssEnv = AbyssEnv;
  }
})(typeof window !== 'undefined' ? window : globalThis);
