# Collections Reference: Vectors, Maps, Sets, and Worklists

The Abyss standard library provides high-performance, flat-memory collections. Designed with mechanical sympathy, they keep allocations contiguous, maximize L1/L2 CPU cache hits, and avoid unnecessary pointer indirection.

All four core collections (`Vec`, `HashMap`, `HashSet`, `Worklist`) are provided by `std/prelude` and are **available without any `@import`**.

```abyss
main :: fn() {
    -- 1. Dynamic Vector
    scores := Vec(i32).new()
    scores.push(95)
    scores.push(100)
    print(scores.get(0))        -- 95

    -- 2. Fast Linear-Probing Hash Map
    lookup := HashMap(Str, i32).new()
    lookup.put("port", 8080)
    print(lookup.get("port").unwrap()) -- 8080

    -- Explicit memory cleanup
    scores.destroy()
    lookup.destroy()
}
```

---

## 1. `Vec(T)` (Dynamic Array)

`Vec(T)` is a dynamically growing contiguous array. It is the workhorse collection of idiomatic Abyss.

### Complete API Reference

- `Vec(T).new() Self`: Creates a new vector with default initial capacity (4).
- `Vec(T).with_cap(initial_cap u64) Self`: Allocates a vector with pre-reserved capacity to avoid reallocations.
- `self.push(val T)`: Appends an element to the end ($O(1)$ amortized).
- `self.pop() Maybe(T)`: Removes and returns the last element, or `none()` if empty.
- `self.get(idx u64) T`: Returns the element at `idx` by value.
- `self.get_ptr(idx u64) &T`: Returns a direct pointer to the element at `idx` (avoids copying large structs).
- `self.set(idx u64, val T)`: Overwrites the element at `idx`.
- `self.reserve(additional u64)`: Ensures space for at least `additional` more elements.
- `self.clear()`: Resets length to 0 without freeing allocated memory.
- `self.destroy()`: Frees backing heap memory.

### Iterating Over a `Vec`

```abyss
names := Vec(Str).new()
names.push("Alice")
names.push("Bob")

for name in names {
    print(name)
}

names.destroy()
```

---

## 2. `HashMap(K, V)` (Associative Map)

`HashMap(K, V)` is an open-addressing, linear-probing hash table utilizing a fast FNV-1a hash function. Keys and values are stored in parallel contiguous arrays to prevent pointer-chasing cache misses.

### Complete API Reference

- `HashMap(K, V).new() Self`: Creates a map with default initial capacity (16).
- `HashMap(K, V).with_cap(cap u64) Self`: Creates a map with pre-allocated capacity.
- `self.put(key K, val V)`: Inserts or updates an entry.
- `self.get(key K) Maybe(V)`: Retrieves a value by key.
- `self.get_ptr(key K) Maybe(&V)`: Retrieves a pointer to the value inside the map for in-place mutation.
- `self.contains(key K) bool`: Checks whether a key is present ($O(1)$ average).
- `self.remove(key K) bool`: Removes an entry by key; returns `true` if found.
- `self.clear()`: Resets all entries without freeing capacity.
- `self.destroy()`: Frees all allocated memory.

```abyss
ages := HashMap(Str, u32).new()
ages.put("Alice", 28)

if ages.contains("Alice") {
    age := ages.get("Alice").unwrap()
    print(age)
}

ages.destroy()
```

---

## 3. `HashSet(T)` (Unique Set)

`HashSet(T)` maintains a collection of unique elements with $O(1)$ lookup and insertion. It shares the open-addressing architecture of `HashMap`.

### Complete API Reference

- `HashSet(T).new() Self`: Creates an empty set.
- `HashSet(T).with_cap(cap u64) Self`: Creates a set with pre-allocated capacity.
- `self.insert(val T) bool`: Inserts `val`; returns `true` if the element was new.
- `self.contains(val T) bool`: Checks if `val` is present.
- `self.remove(val T) bool`: Removes `val`; returns `true` if it was present.
- `self.clear()`: Resets length to 0.
- `self.destroy()`: Frees backing memory.

```abyss
seen := HashSet(i32).new()
seen.insert(42)
seen.insert(42)                  -- Ignored (duplicate)
print(seen.len)                  -- 1
seen.destroy()
```

---

## 4. `Worklist(T)` (Queue / Traversal Stack)

`Worklist(T)` is a specialized high-performance collection designed for graph traversals, compiler passes, and task queues:

- `Worklist(T).new() Self`: Creates a new worklist.
- `self.push(item T)`: Pushes a task/item into the worklist.
- `self.pop() Maybe(T)`: Pops the next task for processing.
- `self.destroy()`: Frees backing memory.

---

## 5. Memory Ownership and Cleanup Rule

Because Abyss has no garbage collector, dynamic collections allocate memory directly from the system heap (`malloc`). 

Whenever a function or struct finishes using a collection, call its `.destroy()` method to release backing memory:

```abyss
process_items :: fn() {
    list := Vec(i32).new()
    -- work with list...
    list.destroy()              -- Prevents memory leaks
}
```

---

[← Previous: Core Reference](01-core.md) | [Next: I/O & Formatting Reference →](03-io-and-fmt.md)
