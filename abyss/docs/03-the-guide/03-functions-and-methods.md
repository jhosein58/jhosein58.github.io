# Functions & Methods: Declarations, Returns, and Receivers

Functions are the primary building blocks of logic in Abyss. They feature minimal syntactic overhead, implicit tail returns, first-class function pointer support, and unified struct method syntax.

Here is a quick look at standalone functions, constructors, and instance methods:

```abyss
-- 1. Standalone function with implicit tail return
add :: fn(a i32, b i32) i32 {
    a + b
}

-- 2. Struct with static constructor and instance method
Rectangle :: struct {
    width  i32
    height i32

    new :: fn(w i32, h i32) Self {
        .{ width: w, height: h }
    }

    area :: fn(self &Self) i32 {
        self.width * self.height
    }
}

main :: fn() {
    rect := Rectangle.new(5, 10)
    print(add(2, 3))
    print(rect.area())
}
```

---

## 1. Function Syntax and Signatures

Functions are declared with double colons `::` followed by the `fn` keyword, parameter list, optional return type, and body block:

```abyss
compute_tax :: fn(amount f64, rate f64) f64 {
    amount * rate
}
```

### Parameter Grouping

When multiple consecutive parameters share the same type, you can group them cleanly:

```abyss
multiply :: fn(a, b i32) i32 {
    a * b
}
```

### No `void` Keyword

If a function does not return a value, you simply omit the return type entirely:

```abyss
log_event :: fn(name Str) {
    print(name)
}
```

There is no `void`, `unit`, or empty tuple needed in the signature.

---

## 2. Returns: Tail Expressions vs Early `ret`

Abyss provides two ways to return values from a function:

### 1. Implicit Tail Return (Idiomatic)

The last expression in a function block automatically acts as its return value. There is no need for a `return` keyword:

```abyss
clamp :: fn(val i32, min i32, max i32) i32 {
    if val < min {
        min
    } else if val > max {
        max
    } else {
        val
    }
}
```

### 2. Early Exit with `ret`

When you need an early return (such as a guard clause), use the `ret` keyword:

```abyss
find_user_id :: fn(username Str) i32 {
    if username.len == 0 {
        ret -1          -- Early return
    }

    -- Normal calculation continues...
    42
}
```

---

## 3. Methods and Struct Receivers

Abyss does not have complex class hierarchies or inheritance. Instead, functions declared inside a `struct` serve as either:
1. **Instance Methods**: Functions whose first parameter is `self &Self` (borrowed) or `self Self` (by-value).
2. **Static Namespaced Functions**: Functions without a `self` parameter (commonly used for constructors).

```abyss
Vector2 :: struct {
    x f64
    y f64

    -- Static constructor (called as Vector2.new)
    new :: fn(x f64, y f64) Self {
        .{ x: x, y: y }
    }

    -- Static helper (called as Vector2.zero)
    zero :: fn() Self {
        .{ x: 0.0, y: 0.0 }
    }

    -- Instance method (called as v.length_sq())
    length_sq :: fn(self &Self) f64 {
        self.x * self.x + self.y * self.y
    }
}
```

### Calling Methods

Instance methods are called using standard dot notation (`.`):

```abyss
v := Vector2.new(3.0, 4.0)
sq := v.length_sq()
print(sq)
```

The compiler automatically takes the address of `v` when calling a method that accepts `self &Self`. You never need to write `(&v).length_sq()`.

---

## 4. Function Pointers and Type Aliases

Functions in Abyss are first-class values. You can assign them to variables, pass them to other functions, or return them.

### Function Type Signatures

A function type is written as `fn(ParamTypes...) [ReturnType]`:

```abyss
Transformer :: fn(i32) i32
```

Top-level declarations without a body or `extern` keyword define **function type aliases**:

```abyss
BinaryOp :: fn(i32, i32) i32
Predicate :: fn(i32) bool

apply :: fn(op BinaryOp, a i32, b i32) i32 {
    op(a, b)
}

add :: fn(x, y i32) i32 { x + y }
sub :: fn(x, y i32) i32 { x - y }

main :: fn() {
    print(apply(add, 10, 5))    -- 15
    print(apply(sub, 10, 5))    -- 5
}
```

---

## 5. Generic Functions and Deferred Type Inference

Functions can accept generic type parameters. Abyss features a bidirectional type unification engine, meaning you rarely need to annotate generic parameters at the call site:

```abyss
identity :: fn(val T) T {
    val
}

main :: fn() {
    -- Inferred as i32
    num := identity(42)

    -- Inferred as Str
    text := identity("Abyss")

    print(num)
    print(text)
}
```

The compiler instantiates (monomorphizes) specialized native code for each concrete type used, guaranteeing zero runtime dispatch overhead.

---

## Idiomatic Summary

| Concept | Idiomatic Abyss | Anti-Pattern |
| :--- | :--- | :--- |
| **No Return Value** | `log :: fn(msg Str) { ... }` | `log :: fn(msg Str) void` |
| **Tail Expression** | `a + b` | `ret a + b` |
| **Early Return** | `ret 0` | `return 0;` |
| **Method Receiver** | `self &Self` | Explicit pointer unrolling |
| **Method Call** | `item.process()` | `(&item).process()` |

---

[← Previous: Control Flow](02-control-flow.md) | [Next: Structs & Types →](04-structs-and-types.md)
