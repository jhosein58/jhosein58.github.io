# I/O & Formatting Reference: `print`, `printf`, and `std/fmt`

Abyss provides a dual-layer I/O and text formatting system:
1. **High-Level Console I/O**: `print`, `write`, and `printf` (provided automatically via `std/prelude`).
2. **Zero-Cost Compile-Time Formatter**: `std/fmt` (`fmt`, `fmt_into`, `Fmt`), which parses and specializes format templates at compile time to eliminate runtime parsing overhead.

```abyss
main :: fn() {
    -- 1. print appends an automatic trailing newline
    print("Welcome to Abyss!")

    -- 2. write outputs without a trailing newline
    write("[")
    write("OK")
    print("]")                  -- Outputs: [OK]

    -- 3. printf formats compile-time templates
    printf("Position: ({}, {})\n", .{10, 20})
}
```

---

## 1. Standard Output: `print`, `write`, `printf`

### `print(value)`

Formats `value` and automatically outputs a **trailing newline (`\n`)**. It functions like `println` in other languages:

```abyss
print(42)
print("A string")
print(true)
```

> **Important**: Never append `\n` to a `print` call (e.g. `print("text\n")`), or you will produce an extra blank line.

### `write(value)`

Formats and outputs `value` **without** a trailing newline. Use `write` for continuous line construction, inline prompts, or progress indicators:

```abyss
write("Loading")
write(".")
write(".")
print(" Done!")                 -- Outputs: Loading.. Done!
```

### `printf(pattern, args)`

Formats `args` according to a compile-time `pattern` string without an automatic trailing newline:

```abyss
x := 100
y := 200
printf("Coordinates: x={}, y={}\n", .{x, y})
```

---

## 2. Compile-Time Formatter (`std/fmt`)

The `std/fmt` module provides zero-cost text construction into memory buffers. Because format patterns are evaluated at compile time:
- There is **zero runtime parsing** of format strings.
- Format arguments are strictly type-checked at compile time.
- Emitted code compiles to direct, inline byte writes.

```abyss
format :: @import("std/fmt")
Arena :: @import("std/allocator").Arena

build_query :: fn(arena &Arena, table Str, id u32) Str {
    -- Specializes template at compile time
    query := format.fmt(arena, "SELECT * FROM {} WHERE id = {};", .{table, id})
    query.as_str()
}
```

### `fmt` vs `fmt_into`

- `format.fmt(arena, pattern, args)`: Allocates and returns a fresh `String` in the provided arena.
- `format.fmt_into(&buffer, pattern, args)`: Appends the formatted output directly into an existing `String` buffer without intermediate allocations:

```abyss
arena := Arena.new(4096)
out := format.fmt(&arena, "Header: {}\n", .{"Start"})
format.fmt_into(&out, "Body: {}\n", .{"Data"})
format.fmt_into(&out, "Footer: {}\n", .{"End"})
print(out.as_str())
arena.destroy()
```

---

## 3. String Construction (`String`)

For manual text assembly without templates, use `String` from `std/string`:

```abyss
String :: @import("std/string").String
Arena :: @import("std/allocator").Arena

main :: fn() {
    arena := Arena.new(1024)
    s := String.new(&arena)

    s.push_str("Hello")
    s.push_char(' ')
    s.push_str("World")
    s.push_u32(2026)

    print(s.as_str())           -- "Hello World2026"
    arena.destroy()
}
```

---

## 4. ANSI Terminal Colors (`std/fmt: escape`)

`std/fmt` includes a zero-allocation ANSI escape table for styling terminal output:

```abyss
fmt :: @import("std/fmt")

main :: fn() {
    esc := fmt.escape()

    printf("{}{}{} success\n", .{esc.fg_green, esc.bold, esc.reset})
    printf("{}{}Warning:{}\n", .{esc.fg_yellow, esc.underline, esc.reset})
}
```

---

[← Previous: Collections](02-collections.md) | [Next: Filesystem & Paths Reference →](04-fs-and-path.md)
