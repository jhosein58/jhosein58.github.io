# C Interoperability & Two-Way FFI

Abyss does not lock you into a walled garden. Because Abyss compiles cleanly to standard ISO C99 and speaks the platform C ABI natively, interoperating with existing C libraries, operating system APIs, and graphics engines is first-class, transparent, and zero-cost.

Here is a minimal program that calls standard C functions:

```abyss
-- 1. Declare external C functions
puts :: extern fn(message &u8) i32
c_abs :: extern "abs" fn(n i32) i32

main :: fn() {
    -- Pass a null-terminated C string using c"..."
    puts(c"Hello from the C runtime!")

    -- Call external math function
    print(c_abs(-42))           -- 42
}
```

---

## 1. Calling C Functions (`extern fn`)

External C functions are declared at module scope using `extern fn` without a body:

```abyss
puts :: extern fn(s &u8) i32
```

By default, the Abyss identifier (`puts`) is used as the C linker symbol name.

### Custom Linker Names

If you want the Abyss binding to have a different name than the underlying C function, provide the C symbol name as a string literal after `extern`:

```abyss
c_cos :: extern "cos" fn(x f64) f64
c_sqrt :: extern "sqrt" fn(x f64) f64
```

### Parameter Styles

You can name your parameters or provide only their types:

```abyss
-- Named parameters
add :: extern fn(a, b i32) i32

-- Anonymous parameters (types only)
multiply :: extern fn(i32, i32) i32
```

### Passing Strings to C: `c"..."`

While standard string literals `"..."` produce Abyss `Str` slices (`.{ ptr, len }`), C library APIs expect null-terminated byte pointers (`&u8`). 

Use `c"..."` to produce a null-terminated C string:

```abyss
puts(c"A null-terminated C string")
```

To convert an existing Abyss `Str` to a C string at runtime, allocate a null-terminated buffer using an arena:

```abyss
Arena :: @import("std/allocator").Arena

c_str := to_cstr(&scratch_arena, my_str)
puts(c_str)
```

---

## 2. Two-Way FFI: Exporting Abyss Functions to C

Abyss supports **two-way interoperability**. You can write functions in Abyss and export them with unmangled C symbols so that foreign C code or shared libraries can call them directly:

```abyss
-- Exported with C linker symbol 'abyss_add'
abyss_add :: extern fn(a, b i32) i32 {
    a + b
}

-- Exported with custom C linker symbol 'my_custom_multiply'
compute :: extern "my_custom_multiply" fn(x i32, y i32) i32 {
    x * y
}
```

When building native code, the compiler emits standard, unmangled C function definitions adhering to the host platform's C calling conventions. When running on the Bytecode VM, these functions remain callable directly as bytecode routines.

---

## 3. C-Compatible Structs (`extern struct`)

Standard Abyss structs may reorder fields to optimize alignment and reduce padding. When exchanging binary records with C, use `extern struct`:

```abyss
Point :: extern struct {
    x f64
    y f64
}

PacketHeader :: extern struct {
    magic u32
    flags u16
    tag   u8
}
```

### Invariants of `extern struct`:
1. **Strict Declaration Order**: Fields are never sorted or reordered; they appear in physical memory in the exact order declared.
2. **Platform C ABI Alignment**: Follows standard platform C alignment and padding rules (e.g. System V AMD64 or Windows x64).
3. **Zero-Cost Sharing**: Can be passed directly by value or by pointer (`&Point`) across C boundaries.

---

## 4. Native C Header Bindings

When writing native code for hosted platforms, you can link directly against target C headers using bracket notation `["header.h"]`:

```abyss
-- Bind to FILE type in stdio.h
File :: extern ["stdio.h"] "FILE" struct {}
tmpfile :: extern ["stdio.h"] fn() &File
fclose  :: extern ["stdio.h"] fn(&File) i32

-- Bind to div_t and div in stdlib.h
DivResult :: extern ["stdlib.h"] "div_t" struct {
    quot i32
    rem  i32
}

divide :: extern ["stdlib.h"] "div" fn(i32, i32) DivResult
```

### Opaque Types and C `void *`

An empty `extern struct {}` creates an **opaque type**. This allows Abyss code to hold and pass pointers to C types whose internal representation is hidden (like `FILE *`).

To represent a generic C `void *`, define:

```abyss
Void :: @typeof({})
VoidPtr :: &Void
```

### Reading Header Constants and Macros (`@c_value`)

Use `@c_value(header, name, T)` to read an integer macro, enum constant, or constant declared in a C header as a fixed-width integer:

```abyss
EOF_VALUE :: fn() i32 {
    @c_value("stdio.h", "EOF", i32)
}
```

---

## 5. Function Type Aliases and Callbacks

You can declare function signatures without `extern` and without a body to define **function type aliases**. These are useful for declaring callback signatures passed to C libraries:

```abyss
-- Define a callback function type alias
CompareFn :: fn(a &Void, b &Void) i32

-- Declare qsort from stdlib.h
qsort :: extern ["stdlib.h"] fn(base &Void, num u64, size u64, cmp CompareFn)
```

---

## 6. Running and Building with C Libraries

### In Native Builds

When you build your project using `sonar build` or compile emitted C with GCC/Clang:

```sh
# Emit C code and compile with external library (e.g. -lm for math)
abyssc b main.a out.c
gcc -O3 out.c -lm -o my_program
./my_program
```

### In the Bytecode VM

The Abyss Bytecode VM includes an integrated dynamic bridge powered by `libffi`. It dynamically dispatches foreign C calls at runtime for standard scalar types, pointers, and structs:

```sh
# If calling a custom shared library:
cc -shared -fPIC helper.c -o helper.so
LD_PRELOAD="$PWD/helper.so" abyssc r main.a
```

---

## Idiomatic Summary

| FFI Feature | Idiomatic Abyss | Purpose |
| :--- | :--- | :--- |
| **Import C function** | `puts :: extern fn(&u8) i32` | Call external C symbol |
| **Custom linker symbol** | `sin :: extern "sin" fn(f64) f64` | Rename binding locally |
| **Export Abyss to C** | `add :: extern fn(a, b i32) i32 { a + b }` | Expose unmangled symbol to C |
| **C-compatible struct** | `Point :: extern struct { x, y f64 }` | Exact C ordering and alignment |
| **Header binding** | `extern ["stdio.h"] ...` | Direct C prototype inclusion |
| **Null-terminated string** | `c"hello"` | Produce `&u8` for C calls |

---

[← Previous: Comptime & Metaprogramming](06-comptime-and-metaprogramming.md) | [Next: Core Standard Library →](../04-reference/01-core.md)
