# Pointers & Memory: Addresses, Auto-Deref, and Arenas

Abyss is built for programmers who want full control over memory without clumsy, archaic C syntax. Memory in Abyss is explicit, transparent, and completely free of garbage collection pauses.

Here is a quick look at pointer manipulation, seamless automatic dereferencing, and arena memory allocation:

```abyss
Arena :: @import("std/allocator").Arena

Node :: struct {
    value i32
    next  &Node
}

main :: fn() {
    -- 1. Create a scoped memory arena
    arena := Arena.new(4096)

    -- 2. Allocate and link nodes
    first := arena.alloc_type(Node)
    first.value = 100           -- Seamless auto-deref!

    second := arena.alloc_type(Node)
    second.value = 200
    first.next = second

    print(first.next.value)     -- Auto-dereferences deeply (200)

    -- 3. Free all allocations in one instant O(1) step
    arena.destroy()
}
```

---

## 1. Pointers and Addresses (`&T`)

A pointer represents the direct physical memory address of a value. In Abyss:
- Pointer types are written as `&T` (a pointer to type `T`).
- The address-of operator is `&`:

```abyss
x := 42
ptr: &i32 = &x          -- Takes the memory address of x
```

Pointers are standard 64-bit machine addresses on 64-bit systems.

---

## 2. Automatic Dereference (Auto-Deref)

One of the most ergonomic features of Abyss is **deep automatic dereferencing**. 

In C or C++, working with pointers requires cumbersome syntax like `(*ptr).field` or `ptr->field`. In Abyss, the dot operator (`.`) automatically and transparently dereferences pointers as deeply as necessary:

```abyss
User :: struct {
    id   u64
    name Str
}

update_user :: fn(u &User) {
    -- Write directly without asterisks or arrows:
    u.id = 99
    print(u.name)
}
```

### Deep Pointer Chains

Auto-dereferencing works cleanly across nested pointers and linked data structures:

```abyss
-- IDIOMATIC in Abyss:
node.next.next.value

-- ANTI-PATTERN (never write this):
(*(*(*node).next).next).value
```

You write clean, readable code; the compiler emits the exact low-level pointer indirection instructions.

---

## 3. Pass-by-Value vs. Pass-by-Reference

Understanding how data moves in memory is essential for writing high-performance systems code:

- **Pass-by-Value (`fn(item Data)`)**: The compiler copies the bytes of the struct onto the call stack or into registers. This is ideal for small structs (scalars, `Point`, `Str`).
- **Pass-by-Reference (`fn(item &Data)`)**: The compiler passes an 8-byte memory address. This is ideal for large structs to avoid copy overhead, or when the function needs to mutate the caller's data.

```abyss
Point :: struct {
    x, y i32

    -- Mutates original instance via pointer
    translate :: fn(self &Self, dx i32, dy i32) {
        self.x = self.x + dx
        self.y = self.y + dy
    }
}
```

---

## 4. No Garbage Collection: The Arena Idiom

Garbage collectors monitor memory at runtime, leading to unpredictable latency spikes and cache thrashing. Abyss has **no garbage collector**.

Instead of hundreds of individual calls to `malloc` and `free`, idiomatic Abyss embraces **scoped arena allocation** (`std/allocator: Arena`):

```abyss
Arena :: @import("std/allocator").Arena

process_request :: fn() {
    -- Allocate a 64KB contiguous memory block
    scratch := Arena.new(65536)

    -- Allocate dynamic structures from the arena
    temp_buffer := scratch.alloc(1024)
    data := scratch.alloc_type(Point)
    data.x = 10
    data.y = 20

    -- When the task is done, release everything instantly:
    scratch.destroy()
}
```

### Why Arenas Beat Garbage Collection:
1. **$O(1)$ Allocation**: Allocating from an arena is just advancing a single pointer (bump allocation). It takes less than 3 CPU cycles.
2. **$O(1)$ Deallocation**: Freeing an entire phase or request takes a single operation (`arena.destroy()`), regardless of whether you allocated 5 objects or 5,000,000.
3. **Cache Locality**: Objects allocated sequentially sit next to each other in contiguous physical memory, keeping L1/L2 CPU caches warm.

---

## 5. Heap Objects and Lifecycle Management

When using dynamic standard collections like `Vec(T)` or `HashMap(K, V)`, memory is managed explicitly via `.destroy()`:

```abyss
main :: fn() {
    list := Vec(i32).new()
    list.push(10)
    list.push(20)

    print(list.len)

    -- Free heap backing memory when finished
    list.destroy()
}
```

---

## Idiomatic Summary

| Operation | Idiomatic Abyss | Anti-Pattern |
| :--- | :--- | :--- |
| **Field Access** | `ptr.field` | `(*ptr).field` or `ptr->field` |
| **Deep Access** | `a.b.c.d` | `(*(*a).b).c.d` |
| **Phase Memory** | `scratch.destroy()` | Hundreds of individual `free()` calls |
| **Collection Cleanup** | `vec.destroy()` | Leaking heap vectors |

---

[← Previous: Structs & Types](04-structs-and-types.md) | [Next: Comptime & Metaprogramming →](06-comptime-and-metaprogramming.md)
