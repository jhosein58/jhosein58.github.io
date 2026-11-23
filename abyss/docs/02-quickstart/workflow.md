# Tooling & Workflow: `abyssc`, `sonar`, and `abyssfmt`

Abyss provides a streamlined, three-tool ecosystem installed directly into your environment:
1. **`abyssc`**: The core Abyss compiler, featuring an instant-execution Bytecode VM and an optimizing C99 native emitter.
2. **`sonar`**: The official package manager and build system for managing dependencies, compiling pods, and running tests.
3. **`abyssfmt`**: The canonical source code formatter enforcing clean, readable Abyss style.

---

## 1. Installation

You can install the complete Abyss toolchain with a single command:

### Linux & macOS (Bash)

```sh
curl -fsSL https://raw.githubusercontent.com/abysslang/abyss/main/scripts/install.sh | bash
```

The installer downloads the latest pre-built toolchain, extracts `abyssc`, `sonar`, and `abyssfmt` to `~/.abyss/bin`, and automatically adds them to your shell's `PATH`.

### Windows (PowerShell)

Open PowerShell and run:

```powershell
irm https://raw.githubusercontent.com/abysslang/abyss/main/scripts/install.ps1 | iex
```

### Verifying the Installation

Open a new terminal session and verify that the tools are available:

```sh
abyssc --version
sonar help
abyssfmt --help
```

---

## 2. The Fast Loop: Run Instantly with `abyssc`

During active development, waiting for a native C compiler and linker adds unnecessary friction. Use the Bytecode VM for instantaneous turnaround:

```sh
abyssc r main.a
```

The compiler parses your code, verifies types, translates AST nodes into compact bytecode instructions, and executes them immediately in memory. Zero disk clutter, zero linker latency.

---

## 3. The Native Loop: Optimized C99 Binaries

When you need peak execution performance, use `abyssc` to emit portable ISO C99:

```sh
# Emit optimized C99 source code
abyssc b main.a out.c

# Compile with your C compiler of choice (GCC or Clang)
gcc -std=gnu99 -D_POSIX_C_SOURCE=200809L -O3 out.c -o my_program
./my_program
```

### Cross-Compilation Targets

`abyssc` includes built-in multi-target support. Use `--target` and `--arch` to select the target platform:

```sh
# Cross-compile to WebAssembly (WASI)
abyssc b --target wasi --arch wasm32 main.a program.c
clang --target=wasm32-wasi -ffreestanding -nostdlib program.c -o program.wasm

# Cross-compile for Windows from Linux
abyssc b --target windows --arch x86_64 main.a program.c
x86_64-w64-mingw32-gcc -O3 program.c -o program.exe
```

Supported operating systems: `linux`, `windows`, `darwin`, `wasi`, `freestanding`.  
Supported architectures: `x86_64`, `aarch64`, `wasm32`.

---

## 4. Project & Package Management with `sonar`

For multi-file applications and packages (called **Pods** in Abyss), use `sonar`:

### Initializing a New Pod

```sh
sonar init my-app
cd my-app
```

This creates a `pod.json` manifest specifying the pod name, version, entry point, dependencies, and native C build options:

```json
{
  "name": "my-app",
  "version": "0.1.0",
  "entry": "main.a",
  "dependencies": {},
  "c_build": {
    "sources": [],
    "include_dirs": [],
    "c_flags": [],
    "ld_flags": []
  }
}
```

### Building and Running Projects

```sh
# Build and run the project binary in one command
sonar run

# Build the release binary into the current directory
sonar build
```

### Managing Dependencies

```sh
# Add a dependency from the central index
sonar add json

# Update local index and download dependencies into .vendor/
sonar update
sonar vendor
```

### Running Unit Tests

Sonar automatically discovers and executes all test suites defined within the pod:

```sh
sonar test
```

---

## 5. Canonical Formatting with `abyssfmt`

Code formatting in Abyss is canonical. Rather than arguing over style, run `abyssfmt` to format files in-place:

```sh
# Format a single file
abyssfmt main.a

# Format an entire source directory
abyssfmt src/
```

### Formatting Rules Enforced:
- 4-space indentation (tabs are rejected).
- Statement separation via clean newlines (no trailing semicolons).
- Clean vertical layout for multiline struct and array literals.

---

[Next Part: The Guide &rarr;](../03-the-guide/01-basics.md)
