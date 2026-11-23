# Core Reference: Foundation Primitives

The `core` pod is the foundational layer of the Abyss language ecosystem. It provides allocation-free data structures, string slice views, optional types, and compile-time reflection records.

Every symbol in `core/prelude` is automatically brought into scope in every Abyss source file—**no `@import` statement is required**.

```abyss
main :: fn() {
    -- 1. Allocation-free Str view
    text: Str = "Deep ocean"
    print(text.len)             -- 10

    -- 2. Optional values with Maybe
    opt := Maybe(i32).some(42)
    if opt.is_some() {
        print(opt.unwrap())     -- 42
    }
}
```

---

## 1. Zero-Import Prelude Catalog

The following types and functions are automatically available across your entire codebase:

| Type / Primitive | Purpose |
| :--- | :--- |
| `Str` | Allocation-free UTF-8 string slice (`.{ ptr: &u8, len: u64 }`). |
| `Maybe(T)` | Type-safe optional container (`some`, `none`, `unwrap_or`). |
| `Choice(T, E)` | Two-track result container for fallible operations. |
| `Slice(T)` | Non-owning contiguous slice view over any array. |
| `Range` | Half-open integer range iterator (`Range.new(0, 10)`). |
| `Iterator` / `RefIterator` | Structural iteration protocol for `for in` loops. |
| `SourceLocation` | Record for `@source_location()` (`file`, `line`, `column`). |
| `TypeInfo`, `FieldInfo`, `TypeKind` | Type introspection records for `@type_info(T)`. |

---

## 2. `Str` (String Slice View)

In Abyss, strings are not null-terminated arrays; they are first-class slice views:

```abyss
Str :: struct {
    ptr &u8
    len u64
}
```

### Key Operations & Methods

- **Creation**:
  ```abyss
  s1 := "Hello"                 -- From literal
  s2 := Str.of(c_ptr)           -- From null-terminated C string
  ```
- **Properties**:
  ```abyss
  length := s1.len              -- O(1) length inspection
  ```
- **Slicing & Substrings**:
  ```abyss
  sub := s1.slice(1, 4)         -- Returns Str view "ell"
  ```
- **Searching & Checking**:
  ```abyss
  has_prefix := s1.starts_with("He")
  has_suffix := s1.ends_with("lo")
  has_sub    := s1.contains("ell")
  ```
- **Character Iteration**:
  ```abyss
  for ch in s1.chars() {
      -- ch is an integer character code
  }
  ```

---

## 3. `Maybe(T)` (Optional Values)

`Maybe(T)` is Abyss's type-safe alternative to null pointers and error sentinel codes (e.g. `-1`):

```abyss
divide :: fn(a i32, b i32) Maybe(i32) {
    if b == 0 {
        ret Maybe(i32).none()
    }
    Maybe(i32).some(a / b)
}
```

### Complete API Reference

- `Maybe(T).some(value T) Self`: Constructs a `Maybe` holding a value.
- `Maybe(T).none() Self`: Constructs an empty `Maybe`.
- `self.is_some() bool`: Returns `true` if a value is present.
- `self.is_none() bool`: Returns `true` if no value is present.
- `self.unwrap() T`: Returns the inner value.
- `self.unwrap_or(fallback T) T`: Returns the inner value if present; otherwise returns `fallback`.

```abyss
result := divide(10, 0).unwrap_or(0)    -- Safe fallback: 0
```

---

## 4. `Choice(T, E)` (Result / Error Handling)

`Choice(T, E)` represents either a success value of type `T` or a failure value of type `E`:

```abyss
parse_port :: fn(port_str Str) Choice(u16, Str) {
    if port_str.len == 0 {
        ret Choice(u16, Str).err("Port string is empty")
    }
    Choice(u16, Str).ok(8080)
}
```

### Complete API Reference

- `Choice(T, E).ok(val T) Self`: Constructs a success result.
- `Choice(T, E).err(err E) Self`: Constructs an error result.
- `self.is_ok() bool`: Returns `true` if operation succeeded.
- `self.is_err() bool`: Returns `true` if operation failed.
- `self.unwrap() T`: Returns the success value.
- `self.unwrap_err() E`: Returns the error value.
- `self.unwrap_or(fallback T) T`: Returns the success value or a fallback.

---

## 5. `Slice(T)` and `Range`

`Slice(T)` represents a view over contiguous memory without taking ownership:

```abyss
Slice :: struct(T type) {
    ptr &T
    len u64
}
```

### `Range`

`Range` provides half-open iteration from `start` up to (but excluding) `end`:

```abyss
r := Range.new(0, 5)
for i in r {
    print(i)                    -- Outputs: 0, 1, 2, 3, 4
}
```

---

## 6. Compile-Time Reflection Types

Introspecting types at compile time via `@type_info(T)` returns a `TypeInfo` struct:

```abyss
TypeInfo :: struct {
    name   Str
    size   u64
    align  u64
    kind   TypeKind
    fields Slice(FieldInfo)
}

FieldInfo :: struct {
    name   Str
    offset u64
    type   TypeInfo
}
```

`TypeKind` is an enum identifying whether the type is an integer, float, pointer, struct, union, enum, or slice.

---

[← Previous: C Interoperability](../03-the-guide/07-c-interop.md) | [Next: Collections Reference →](02-collections.md)
