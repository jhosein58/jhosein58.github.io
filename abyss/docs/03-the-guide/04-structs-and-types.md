# Structs & Types: Data Layout, Constructors, and Generics

In Abyss, data is king. Abyss rejects bloated object models, hidden vtables, and inheritance chains in favor of clean, transparent structures whose layout directly matches physical memory.

Here is a quick look at struct definition, instantiation, and generics:

```abyss
-- 1. Struct with clean field definitions and constructor
Point :: struct {
    x, y i32

    new :: fn(x i32, y i32) Self {
        .{ x: x, y: y }
    }
}

-- 2. Generic container struct
Box :: struct(T type) {
    value T

    new :: fn(val T) Self {
        .{ value: val }
    }
}

main :: fn() {
    p := Point.new(10, 20)
    b := Box().new("Wrapped text")      -- Type inferred automatically

    print(p.x)
    print(b.value)
}
```

---

## 1. Struct Declaration and Field Syntax

Structs are declared using `struct { ... }`. Fields are declared using the clean `name Type` syntax without colons:

```abyss
User :: struct {
    id        u64
    name      Str
    is_active bool
}
```

### Grouped Fields

Fields sharing the same type can be declared together on a single line:

```abyss
ColorRGBA :: struct {
    r, g, b, a u8
}
```

### Memory Layout Guarantees

Abyss structs contain **only** the data fields you explicitly declare:
- **No hidden pointers** (no vtables or class metadata).
- **No implicit padding bytes** beyond standard natural alignment for the target architecture.
- Passing or storing a struct is as cheap and predictable as in pure C.

---

## 2. Instantiation with Struct Literals (`.{ ... }`)

Struct instances are created using anonymous literal syntax `.{ ... }`:

```abyss
-- Explicit type annotation with inferred literal:
p: Point = .{ x: 10, y: 20 }

-- Field values can be expressions or variables:
origin := Point.new(0, 0)
```

### Anonymous Structs

You can also create ad-hoc anonymous structs on the fly without a preceding nominal declaration:

```abyss
config := .{
    host: "127.0.0.1",
    port: 8080,
    timeout_ms: 5000
}

print(config.host)
print(config.port)
```

---

## 3. The `Self` Alias

Within any struct declaration, `Self` serves as a convenient alias for the enclosing type. This avoids repeating lengthy type names in constructors and methods:

```abyss
Counter :: struct {
    value i32

    new :: fn() Self {
        .{ value: 0 }
    }

    increment :: fn(self &Self) {
        self.value = self.value + 1
    }
}
```

---

## 4. Enums and Tagged Unions

Abyss supports both simple enumerations and tagged unions with data payloads.

### Enums

Enums represent a closed set of named integral constants:

```abyss
Direction :: enum {
    North
    East
    South
    West
}

heading := Direction.North
```

### Tagged Unions

Unions hold one of several possible data payloads accompanied by an internal discriminant tag:

```abyss
Result :: union {
    Ok: i32
    Err: Str
}

handle_result :: fn(r Result) {
    match r {
        Result.Ok  => print("Success!")
        Result.Err => print("Failed!")
    }
}
```

---

## 5. Generics: Type Parameters and Deferred Inference

Types are first-class citizens in Abyss. Structs can be parameterized by types:

```abyss
Pair :: struct(T type) {
    first  T
    second T

    new :: fn(a T, b T) Self {
        .{ first: a, second: b }
    }
}
```

### Deferred Inference

Abyss features bidirectional type inference. When calling generic constructors, you can omit the type argument:

```abyss
-- The compiler infers T as i32 automatically:
int_pair := Pair().new(10, 20)

-- The compiler infers T as Str automatically:
str_pair := Pair().new("left", "right")
```

The compiler specializes a concrete native C struct for each distinct type argument used in your code.

---

## 6. Compile-Time Type Introspection (`@typeof`, `@type_name`)

Abyss provides built-in compile-time intrinsics to inspect types:

- `@typeof(expr)`: Evaluates to the compile-time type of an expression.
- `@type_name(T)`: Evaluates to a compile-time `Str` representing the human-readable name of type `T`.

```abyss
x := 42
print(@type_name(@typeof(x)))   -- Prints: "i32"
```

---

## Idiomatic Summary

| Struct Feature | Idiomatic Abyss | Anti-Pattern |
| :--- | :--- | :--- |
| **Field Syntax** | `x i32` | `x: i32;` |
| **Instantiation** | `.{ x: 10, y: 20 }` | `new Point(10, 20)` |
| **Enclosing Type** | `Self` | Manually repeating struct name |
| **Generic Call** | `Vec().new()` | `Vec(i32).new()` (when inferrable) |

---

[← Previous: Functions & Methods](03-functions-and-methods.md) | [Next: Pointers & Memory →](05-pointers-and-memory.md)
