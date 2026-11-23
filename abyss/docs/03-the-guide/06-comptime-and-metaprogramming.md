# Comptime & Metaprogramming: The VM, Splices, and Reflection

In many languages, metaprogramming requires clunky external code generators, Python pre-build scripts, or complex, unreadable macro languages. 

In Abyss, **metaprogramming is just Abyss code**. The compiler contains an integrated bytecode VM that executes standard Abyss expressions during compilation, eliminating runtime overhead and enabling zero-cost abstractions.

Here is a quick look at `cmpt` evaluation, string splices, and compile-time reflection:

```abyss
-- 1. Computed strictly at compile-time via the VM
MAGIC_CONSTANT :: cmpt {
    sum := 0
    i := 1
    while i <= 100 {
        sum = sum + i
        i = i + 1
    }
    sum                 -- Evaluates to 5050 at compile time
}

-- 2. Compile-time string splice (generates code dynamically)
#`
generated_multiplier :: fn(x i32) i32 {
    x * 10
}
`

main :: fn() {
    print(MAGIC_CONSTANT)
    print(generated_multiplier(5))
}
```

---

## 1. Compile-Time Evaluation (`cmpt`)

The `cmpt` keyword marks a variable, block, or expression that must be evaluated at compile time on the compiler's integrated bytecode VM:

```abyss
FACTORIAL_10 :: cmpt {
    fact :: fn(n u64) u64 {
        if n <= 1 { 1 } else { n * fact(n - 1) }
    }
    fact(10)
}
```

### Why `cmpt` Matters
- **Zero Runtime Overhead**: Complex mathematical calculations, lookup tables, or validation checks run on the compiler's VM. The emitted C99 code simply contains the resulting constant literal.
- **No Separate Macro Language**: You write standard Abyss syntax with standard loops, functions, and control flow.

---

## 2. String Splices (`#`)

The splice operator `#` takes a compile-time string expression, parses it as Abyss source code, and injects the resulting AST nodes directly into the program:

```abyss
-- Injecting an inline expression:
multiplier := #"100"

-- Generating a declaration from a multiline template:
#`
Point3D :: struct {
    x, y, z f64
}
`
```

### Raw Multiline Strings (Backticks)

Abyss supports raw multiline strings using backticks `` `...` ``. These preserve newlines and special characters without clumsy escape sequences, making them ideal for code-generation templates:

```abyss
make_getter :: fn(cmpt field_name Str) Str {
    -- Returns formatted source code string
    `get_val :: fn() i32 { 42 }`
}

#make_getter("id")
```

---

## 3. Multi-Level Quotes (`##`, `###`)

Abyss supports multi-level quote/unquote metaprogramming:
- `#str` expands at compile-time.
- `##str` delays expansion until the enclosing splice is processed.

This allows you to write high-order metaprograms—functions that generate code that in turn generates code—with complete lexical hygiene.

---

## 4. Compile-Time Reflection (`@type_info`)

Abyss features first-class compile-time reflection via the `@type_info` intrinsic (available via the zero-import prelude):

```abyss
User :: struct {
    id   u64
    name Str
}

main :: fn() {
    -- Introspect struct properties at compile-time
    info := cmpt { @type_info(User) }

    print(info.name)                    -- "User"
    print(info.fields.len)              -- 2
    print(info.fields.get(0).name)      -- "id"
    print(info.fields.get(1).name)      -- "name"
}
```

### Zero-Cost Serialization and Formatting

Because reflection can be executed inside `cmpt` blocks, you can inspect types to generate customized, specialized serialization routines (like JSON or binary packing) that compile directly to straight-line, branch-free C code with **zero runtime metadata** bundled into the binary.

---

## 5. Compile-Time Invariants and `#fall`

Combine `cmpt` with `#fall` to enforce strict architectural constraints during compilation:

```abyss
fall :: @import("std/sys").fall

cmpt {
    size := @type_info(User).size
    if size > 64 {
        -- Fails compilation with exact file and line location
        #fall
    }
}
```

---

## Idiomatic Summary

| Metaprogramming | Idiomatic Abyss | Anti-Pattern |
| :--- | :--- | :--- |
| **Comptime Blocks** | `cmpt { ... }` | External pre-build Python scripts |
| **Code Injection** | `#` and `#` `...` `` | Complex preprocessor macros |
| **Type Inspection** | `@type_info(T)` | Runtime vtables or reflection tags |
| **Static Assertions** | `cmpt { if bad { #fall } }` | Runtime crashes |

---

[← Previous: Pointers & Memory](05-pointers-and-memory.md) | [Next: C Interoperability & FFI →](07-c-interop.md)
