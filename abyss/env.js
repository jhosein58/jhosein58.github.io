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
    wasmPath: 'playground/abyssc.wasm?v=0.25.0',
    wasmModule: null,
    loadPromise: null,
    encoder: new TextEncoder(),
    decoder: new TextDecoder(),

    configure: function(opts) {
      if (!opts) return;
      if (opts.wasmPath) this.wasmPath = opts.wasmPath;
    },

    isReady: function() {
      return this.wasmModule !== null;
    },

    load: function() {
      if (this.wasmModule) {
        return Promise.resolve({ mod: this.wasmModule });
      }
      if (this.loadPromise) return this.loadPromise;

      const self = this;
      this.loadPromise = (async function() {
        let mod;
        try {
          if (typeof WebAssembly.compileStreaming === 'function') {
            mod = await WebAssembly.compileStreaming(fetch(self.wasmPath));
          }
        } catch (_) {}
        if (!mod) {
          const res = await fetch(self.wasmPath);
          if (!res.ok) throw new Error('Failed to load WebAssembly binary (' + res.status + ')');
          const buf = await res.arrayBuffer();
          mod = await WebAssembly.compile(buf);
        }
        self.wasmModule = mod;
        return { mod: mod };
      })().catch(function(err) {
        self.loadPromise = null;
        throw err;
      });

      return this.loadPromise;
    },

    run: async function(code) {
      await this.load();

      const cleanCode = (code || '').replace(/\u00A0/g, ' ').replace(/\r\n/g, '\n');
      const codeBytes = this.encoder.encode(cleanCode);

      const args = ['abyssc', 'r', 'main.a'];
      const argsEncoded = args.map(a => this.encoder.encode(a + '\0'));
      const totalArgsLen = argsEncoded.reduce((acc, a) => acc + a.length, 0);

      let stdoutText = '';
      let exitCode = 0;
      let openFiles = {};
      let nextFd = 4;
      let memory;

      const self = this;
      const wasi = {
        args_sizes_get: (argc_ptr, argv_buf_size_ptr) => {
          const view = new DataView(memory.buffer);
          view.setUint32(argc_ptr, args.length, true);
          view.setUint32(argv_buf_size_ptr, totalArgsLen, true);
          return 0;
        },
        args_get: (argv_ptr, argv_buf_ptr) => {
          const view = new DataView(memory.buffer);
          const mem = new Uint8Array(memory.buffer);
          let currBuf = argv_buf_ptr;
          for (let i = 0; i < argsEncoded.length; i++) {
            view.setUint32(argv_ptr + i * 4, currBuf, true);
            mem.set(argsEncoded[i], currBuf);
            currBuf += argsEncoded[i].length;
          }
          return 0;
        },
        environ_sizes_get: (count_ptr, size_ptr) => {
          const view = new DataView(memory.buffer);
          view.setUint32(count_ptr, 0, true);
          view.setUint32(size_ptr, 0, true);
          return 0;
        },
        environ_get: () => 0,
        proc_exit: (status) => {
          exitCode = status;
          throw new Error('__wasi_exit_' + status);
        },
        fd_prestat_get: (fd, prestat_ptr) => {
          if (fd === 3) {
            const view = new DataView(memory.buffer);
            view.setUint32(prestat_ptr, 0, true);
            view.setUint32(prestat_ptr + 4, 1, true);
            return 0;
          }
          return 8;
        },
        fd_prestat_dir_name: (fd, name_ptr) => {
          if (fd === 3) {
            new Uint8Array(memory.buffer)[name_ptr] = 46;
            return 0;
          }
          return 8;
        },
        path_open: (fd, lookup_flags, path_ptr, path_len, oflags, rights_base, rights_inheriting, fdflags, opened_fd_ptr) => {
          const mem = new Uint8Array(memory.buffer);
          let path = self.decoder.decode(mem.subarray(path_ptr, path_ptr + path_len));
          if (path.startsWith('./')) path = path.slice(2);
          if (path === 'main.a') {
            const f = nextFd++;
            openFiles[f] = { data: codeBytes, offset: 0 };
            new DataView(memory.buffer).setUint32(opened_fd_ptr, f, true);
            return 0;
          }
          return 44;
        },
        fd_read: (fd, iovs_ptr, iovs_len, nread_ptr) => {
          const file = openFiles[fd];
          if (!file) return 8;
          const view = new DataView(memory.buffer);
          const mem = new Uint8Array(memory.buffer);
          let totalRead = 0;
          for (let i = 0; i < iovs_len; i++) {
            let ptr = view.getUint32(iovs_ptr + i * 8, true);
            let len = view.getUint32(iovs_ptr + i * 8 + 4, true);
            if (len === 0 && view.getUint32(iovs_ptr + i * 16 + 8, true) > 0) {
              ptr = view.getUint32(iovs_ptr + i * 16, true);
              len = view.getUint32(iovs_ptr + i * 16 + 8, true);
            }
            const avail = Math.min(len, file.data.length - file.offset);
            if (avail > 0) {
              mem.set(file.data.subarray(file.offset, file.offset + avail), ptr);
              file.offset += avail;
              totalRead += avail;
            }
          }
          view.setUint32(nread_ptr, totalRead, true);
          return 0;
        },
        fd_seek: (fd, offset, whence, new_offset_ptr) => {
          const file = openFiles[fd];
          if (!file) return 8;
          let newPos = file.offset;
          offset = Number(offset);
          if (whence === 0) newPos = offset;
          else if (whence === 1) newPos += offset;
          else if (whence === 2) newPos = file.data.length + offset;
          file.offset = Math.max(0, Math.min(newPos, file.data.length));
          new DataView(memory.buffer).setBigUint64(new_offset_ptr, BigInt(file.offset), true);
          return 0;
        },
        fd_close: (fd) => {
          delete openFiles[fd];
          return 0;
        },
        fd_write: (fd, iovs_ptr, iovs_len, nwritten_ptr) => {
          const view = new DataView(memory.buffer);
          const mem = new Uint8Array(memory.buffer);
          let total = 0;
          for (let i = 0; i < iovs_len; i++) {
            let ptr = view.getUint32(iovs_ptr + i * 8, true);
            let len = view.getUint32(iovs_ptr + i * 8 + 4, true);
            if (len === 0 && view.getUint32(iovs_ptr + i * 16 + 8, true) > 0) {
              ptr = view.getUint32(iovs_ptr + i * 16, true);
              len = view.getUint32(iovs_ptr + i * 16 + 8, true);
            }
            if (fd === 1 || fd === 2) {
              stdoutText += self.decoder.decode(mem.subarray(ptr, ptr + len));
            }
            total += len;
          }
          view.setUint32(nwritten_ptr, total, true);
          return 0;
        },
        path_create_directory: () => 0,
        fd_readdir: () => 0
      };

      const t0 = performance.now();
      try {
        const instance = await WebAssembly.instantiate(this.wasmModule, { wasi_snapshot_preview1: wasi });
        memory = instance.exports.memory;
        instance.exports._start();
      } catch (err) {
        if (!err.message.startsWith('__wasi_exit_')) {
          stdoutText += '\nRuntime error: ' + err.message + '\n';
          exitCode = 1;
        }
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
