# Allocators & Memory Reference: `std/allocator` and `std/mem`

Abyss provides two distinct levels of memory management:
1. **Scoped Arena Allocator (`std/allocator: Arena`)**: High-performance, fragment-free bump allocation for phases, requests, and structured lifecycles.
2. **Low-Level Memory Primitives (`std/mem`)**: Direct system-level heap allocation (`malloc`, `free`, `realloc`) and raw byte operations (`mem_copy`, `mem_set`).

```abyss
Arena :: @import("std/allocator").Arena

main :: fn() {
    -- 1. Create a scoped arena
    arena := Arena.new(32768)

    -- 2. Allocate typed structures with 8-byte alignment
    point := arena.alloc_type(Point)
    point.x = 100
    point.y = 200

    -- 3. Release entire memory pool in O(1)
    arena.destroy()
}
```

---

## 1. The Arena Allocator (`std/allocator: Arena`)

The `Arena` struct manages a linked chain of memory chunks. Allocations simply advance an offset pointer (bump allocation), making them nearly instantaneous ($O(1)$) and keeping memory contiguous for optimal CPU cache utilization.

### Complete `Arena` API

- `Arena.new(default_chunk_size u64) Arena`:  
  Initializes an arena with a default chunk size (e.g. 4096, 65536).
- `self.alloc(size u64) &u8`:  
  Allocates `size` bytes from the current chunk with 8-byte alignment. If the chunk lacks space, a new chunk is allocated automatically.
- `self.alloc_type(T type) &T`:  
  Convenience helper that allocates `@sizeof(T)` bytes and returns a typed pointer `&T`.
- `self.alloc_slice(T type, count u64) Slice(T)`:  
  Allocates contiguous memory for `count` elements of type `T` and returns a `Slice(T)` view.
- `self.reset()`:  
  Resets allocation offsets back to zero without freeing the underlying chunks from the OS. This allows reusing the allocated memory across iterations or game frames with zero allocation overhead.
- `self.destroy()`:  
  Frees all chunks and returns memory to the operating system.

### The Arena Lifecycle Pattern

```abyss
handle_web_request :: fn() {
    scratch := Arena.new(65536)

    -- Allocate whatever the request needs:
    -- strings, JSON nodes, temporary buffers...

    -- When request finishes, free all allocations in one call:
    scratch.destroy()
}
```

---

## 2. Low-Level Heap Memory (`std/mem`)

The `std/mem` module exposes direct, raw memory allocation routines interfacing directly with the platform's C runtime or system allocator:

```abyss
mem :: @import("std/mem")

main :: fn() {
    -- Allocate raw bytes
    buf := mem.malloc(1024)

    -- Zero-fill memory
    mem.mem_zero(buf, 1024)

    -- Free raw bytes
    mem.free(buf)
}
```

### Complete `std/mem` API

- `malloc(size u64) &u8`: Allocates `size` uninitialized bytes from the system heap.
- `free(ptr &u8)`: Deallocates memory previously returned by `malloc` or `realloc`.
- `realloc(ptr &u8, new_size u64) &u8`: Resizes an existing heap allocation.
- `mem_copy(dest &u8, src &u8, count u64)`: Copies `count` bytes from `src` to `dest`.
- `mem_set(dest &u8, val u8, count u64)`: Sets `count` bytes of `dest` to `val`.
- `mem_zero(dest &u8, count u64)`: Sets `count` bytes of `dest` to 0.
- `mem_eq(a &u8, b &u8, count u64) bool`: Compares `count` bytes for equality.

---

## 3. Allocation Strategy Guide

| Use Case | Recommended Allocator | Rationale |
| :--- | :--- | :--- |
| **Short-lived phase, loop, or request** | `Arena` | Fast $O(1)$ bump allocation, zero fragmentation, instant cleanup. |
| **Frame updates (games, simulations)** | `Arena` with `.reset()` | Zero new allocations after initial warmup. |
| **Collections (`Vec`, `HashMap`)** | `malloc` / `realloc` via collection methods | Supports independent growth and resizing. |
| **Long-lived single objects** | `malloc` / `Arena` | Depends on lifecycle boundaries. |

---

[← Previous: Filesystem & Paths](04-fs-and-path.md) | [Next: System & Threading Reference →](06-sys-and-threading.md)
