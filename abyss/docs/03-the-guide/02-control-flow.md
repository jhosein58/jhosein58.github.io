# Control Flow: Branching, Loops, and Pattern Matching

Programs make decisions, repeat operations, and decompose data structures. Abyss provides clean, expression-oriented control flow constructs that map directly to predictable machine instructions.

Let's look at a quick example combining branching, looping, and pattern matching:

```abyss
main :: fn() {
    status_code := 200

    -- 1. If-else as an expression
    status := if status_code == 200 { "OK" } else { "Error" }
    print(status)

    -- 2. Clean while loop
    count := 3
    while count > 0 {
        print(count)
        count = count - 1
    }

    -- 3. Pattern matching
    match status_code {
        200 => print("Success")
        404 => print("Not Found")
        500 => print("Internal Server Error")
        _   => print("Unknown Status")
    }
}
```

---

## 1. Branching with `if` and `else`

In Abyss, conditions do not require surrounding parentheses, but the body block must always be enclosed in curly braces `{ ... }`:

```abyss
temperature := 85

if temperature > 100 {
    print("Boiling point exceeded")
} else if temperature > 60 {
    print("Warm operation")
} else {
    print("Optimal temperature")
}
```

### `if` as an Expression

Because Abyss is expression-oriented, `if/else` can yield a value directly. This replaces the ternary operator found in other languages with a clean, readable syntax:

```abyss
threshold := 10
priority := if threshold > 5 { "High" } else { "Normal" }
```

When used as an expression, both the `if` and `else` branches must evaluate to compatible types.

---

## 2. Looping with `while`

The `while` loop executes its body repeatedly as long as its condition remains `true`:

```abyss
i := 0
while i < 5 {
    print(i)
    i = i + 1
}
```

### Loop Control: `break` and `cont`

You can control loop execution using:
- `break`: Halts the loop immediately and resumes execution after the closing brace.
- `cont`: Skips the remainder of the current iteration and starts the next one immediately. *(Note: Abyss uses `cont`, not `continue`.)*

```abyss
n := 0
while n < 10 {
    n = n + 1
    if n % 2 == 0 {
        cont            -- Skip even numbers
    }
    if n > 7 {
        break           -- Stop once n exceeds 7
    }
    print(n)            -- Outputs: 1, 3, 5, 7
}
```

---

## 3. High-Level Iteration with `for`

Abyss provides a high-level `for in` construct that iterates over any collection, slice, or type implementing the standard structural iterator protocol:

```abyss
-- Iterating over an array or slice
numbers := .[10, 20, 30, 40]
for num in numbers {
    print(num)
}
```

### How `for` Works Under the Hood

The `for` loop is completely zero-cost. It desugars into an iterator inspection loop. Any type that exposes a `next(self &Self) Maybe(T)` method can be looped over with `for`:

```abyss
MyRange :: struct {
    curr i32
    max  i32

    next :: fn(self &Self) Maybe(i32) {
        if self.curr < self.max {
            val := self.curr
            self.curr = self.curr + 1
            ret Maybe(i32).some(val)
        }
        Maybe(i32).none()
    }
}
```

When you write `for item in my_range`, the compiler repeatedly calls `next()`, unwraps `Maybe(T).some(val)`, and exits cleanly when `Maybe(T).none()` is returned.

---

## 4. Pattern Matching with `match`

Pattern matching allows you to branch based on the shape and value of data. Match arms are separated by commas or newlines:

```abyss
level := 2

match level {
    0 => print("Junior")
    1 => print("Mid-Level")
    2 => print("Senior")
    _ => print("Principal")
}
```

### Multiple Patterns in a Single Arm

You can group multiple patterns on a single arm using commas `,`:

```abyss
digit := '7'

match digit {
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' => {
        print("Digit recognized")
    }
    _ => {
        print("Not a digit")
    }
}
```

### The Wildcard Pattern `_`

The underscore `_` acts as a default catch-all pattern. If no preceding arm matches, the wildcard arm is executed.

### Matching on Enums and Unions

Pattern matching is particularly powerful when working with tagged unions and enumerations:

```abyss
Color :: enum {
    Red
    Green
    Blue
}

c := Color.Green

match c {
    Color.Red   => print("Hex: #FF0000")
    Color.Green => print("Hex: #00FF00")
    Color.Blue  => print("Hex: #0000FF")
}
```

---

## 5. Source Locations and Fatal Errors (`#fall`)

Abyss gives you built-in compile-time introspection into source locations. `@source_location()` returns a compile-time record with the current file path, line, and column:

```abyss
loc := @source_location()
-- loc.file is Str, loc.line is u32, loc.column is u32
```

### Unrecoverable Errors with `#fall`

When an unrecoverable invariant is violated, use `#fall` (from `std/sys`) to print the exact call site location to `stderr` and abort the program:

```abyss
fall :: @import("std/sys").fall

verify_pointer :: fn(ptr &u8) {
    if ptr == 0 {
        #fall           -- Prints file, line, and column then exits with code 1
    }
}
```

---

## Idiomatic Summary

| Control Flow | Idiomatic Abyss | Anti-Pattern |
| :--- | :--- | :--- |
| **Ternary Choice** | `val := if cond { a } else { b }` | Nested flags or assignments |
| **Loop Continue** | `cont` | `continue` |
| **Iteration** | `for x in collection { ... }` | Manual `while i < len` indexing |
| **Match Separator** | Newlines or `,` between arms | Semicolons `;` in match arms |
| **Default Pattern** | `_ => ...` | `default:` |

---

[← Previous: Basics](01-basics.md) | [Next: Functions & Methods →](03-functions-and-methods.md)
