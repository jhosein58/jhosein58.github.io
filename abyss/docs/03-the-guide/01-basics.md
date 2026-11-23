# Basics: Variables, Types, and Expressions

Abyss is an expression-oriented systems programming language. It combines the raw control and transparency of C with clean, modern syntax and bidirectional type inference.

Let's begin with a complete, minimal program:

```abyss
main :: fn() {
    x := 42
    pi: f64 = 3.14159
    greeting := "Hello from the deep!"

    print(greeting)
    print(x)
}
```

Save this as `basics.a` and run it instantly with the bytecode VM:

```sh
abyssc r basics.a
```

---

## 1. Variables and Bindings

In Abyss, local variables are declared using the short-declaration operator `:=`. The compiler automatically infers the type from the right-hand value:

```abyss
count := 10             -- Inferred as i32
ratio := 0.75           -- Inferred as f64
is_valid := true        -- Inferred as bool
message := "Ready"      -- Inferred as Str
```

### Explicit Type Annotations

When you want an exact type rather than the inferred default, provide an explicit type annotation using `: Type =`:

```abyss
small_id: u8 = 255
huge_counter: u64 = 10000000000
precise_float: f32 = 1.4142135
```

### Reassignment and Mutability

Local variables are mutable by default. You can update their value at any time with `=`:

```abyss
score := 100
score = score + 50
score = score * 2
```

### Module-Level Variables

Variables can also be declared at the module level. You can give them a compile-time initial value or omit the initializer to start zeroed:

```abyss
default_port :: 8080
active_connections := 0
total_bytes_served: u64

register_connection :: fn() {
    active_connections = active_connections + 1
}
```

Each module has a single global instance of its module variables. Their addresses are fixed and stable across the lifetime of the program.

---

## 2. Compile-Time Constants (`::`)

Constants are declared with double colons `::`. Constants are evaluated strictly at compile time and have zero runtime footprint:

```abyss
MAX_BUFFER_SIZE :: 4096
PI :: 3.141592653589793
APP_NAME :: "Abyss Engine"
```

Because constants are resolved by the compiler, you can use them anywhere a constant value or type expression is expected, such as array sizes or memory limits.

---

## 3. Primitive Types

Abyss gives you direct, fixed-width numeric types matching standard hardware sizes:

### Integers

| Type | Bits | Kind | Range |
| :--- | :--- | :--- | :--- |
| `i8` | 8 | Signed | $-128$ to $127$ |
| `i16` | 16 | Signed | $-32,768$ to $32,767$ |
| `i32` | 32 | Signed | $-2,147,483,648$ to $2,147,483,647$ |
| `i64` | 64 | Signed | $-9.22 \times 10^{18}$ to $9.22 \times 10^{18}$ |
| `i128` | 128 | Signed | 128-bit signed integer |
| `u8` | 8 | Unsigned | $0$ to $255$ |
| `u16` | 16 | Unsigned | $0$ to $65,535$ |
| `u32` | 32 | Unsigned | $0$ to $4,294,967,295$ |
| `u64` | 64 | Unsigned | $0$ to $1.84 \times 10^{19}$ |
| `u128` | 128 | Unsigned | 128-bit unsigned integer |

Integer literals without suffixes default to `i32` unless constrained by context.

### Floating-Point Numbers

- `f32`: Single-precision 32-bit IEEE 754 float.
- `f64`: Double-precision 64-bit IEEE 754 float (default for floating-point literals).

### Booleans

The `bool` type has two values: `true` and `false`. Booleans are strictly typed and do not implicitly convert to integers:

```abyss
is_active: bool = true
is_done := false
```

### Characters

Abyss does not have a distinct `char` primitive type. Character literals enclosed in single quotes `'a'`, `'Z'`, `'\n'` are compile-time integer literals:

```abyss
newline := '\n'         -- Untyped integer literal
ascii_code: u8 = 'A'   -- Coerces seamlessly to u8 (value 65)
offset: i32 = '0'       -- Coerces seamlessly to i32 (value 48)
```

---

## 4. Operators and Arithmetic

Abyss supports the standard suite of arithmetic, bitwise, and comparison operators:

### Arithmetic Operators
```abyss
sum := 10 + 5           -- Addition (15)
diff := 20 - 4          -- Subtraction (16)
prod := 6 * 7           -- Multiplication (42)
quot := 40 / 8          -- Division (5)
rem := 14 % 3           -- Remainder (2)
```

### Bitwise Operators
```abyss
a := 0b1100
b := 0b1010

and_res := a & b        -- Bitwise AND (0b1000)
or_res  := a | b        -- Bitwise OR  (0b1110)
xor_res := a ^ b        -- Bitwise XOR (0b0110)
shl_res := a << 2       -- Shift left  (0b110000)
shr_res := a >> 1       -- Shift right (0b0110)
not_res := ~a           -- Bitwise NOT
```

### Comparison Operators
```abyss
equal := (a == b)
not_eq := (a != b)
less := (a < b)
greater := (a > b)
less_eq := (a <= b)
greater_eq := (a >= b)
```

### Logical Operators
Abyss uses readable keyword operators for boolean logic with full short-circuit evaluation:

```abyss
if has_permission and is_admin {
    print("Access granted")
}

if is_cached or load_from_disk() {
    print("Data available")
}

if not is_connected {
    print("Offline")
}
```

---

## 5. Expressions and Sequencing

Abyss is an expression-oriented language. Blocks wrapped in braces `{ ... }` evaluate to their final expression:

```abyss
result := {
    step1 := 10 * 2
    step2 := step1 + 5
    step2 * 3           -- The block evaluates to 75
}
```

### No Semicolons

Abyss source code does not use semicolons. Statements and declarations are separated by **newlines**:

```abyss
a := 10
b := 20
c := a + b
```

If you wish to sequence multiple expressions on the same line, use a **comma** `,`:

```abyss
val := { a := 2, b := 4, a + b }
print(1), print(2), print(3)
```

### Comments

Comments are strictly single-line and begin with `--`:

```abyss
-- This is a comment
x := 100 -- Comments can follow any statement
```

*(Double-slash `//` is not valid Abyss syntax.)*

---

## 6. Strings: `Str` vs `c"..."`

In Abyss, text is represented by the `Str` slice structure, provided automatically by the standard prelude without any imports:

```abyss
Str :: struct {
    ptr &u8
    len u64
}
```

A standard string literal `"..."` always produces a `Str`. It holds a pointer to the UTF-8 bytes and an explicit 64-bit length:

```abyss
greeting := "Hello, Abyss!"
length := greeting.len  -- 13
```

Because `Str` tracks its own length, determining string length is an instant $O(1)$ operation, and strings can safely contain embedded null bytes.

### C Strings (`c"..."`)

When interfacing with external C libraries or system APIs that expect null-terminated C strings, use `c"..."`:

```abyss
c_str := c"null-terminated string"  -- Produces &u8
```

You can convert a C string to an Abyss `Str` at any time using `Str.of`:

```abyss
str_view := Str.of(c_str)
```

---

## Idiomatic Summary

| Concept | Idiomatic Abyss | Anti-Pattern |
| :--- | :--- | :--- |
| **Local Variables** | `x := 42` | `var x: i32 = 42;` |
| **Constants** | `LIMIT :: 100` | `const LIMIT = 100;` |
| **Comments** | `-- comment` | `// comment` or `/* */` |
| **String Type** | `name: Str` | `name: &u8` (unless C FFI) |
| **Sequencing** | Newlines or `,` | Semicolons `;` |

---

[← Previous: Tooling & Workflow](../02-quickstart/workflow.md) | [Next: Control Flow →](02-control-flow.md)
