# Into the Abyss

*The Official Guide to the Abyss Programming Language*

Welcome to **Into the Abyss**.

This book is designed for programmers who want to build fast, predictable software without fighting layers of unnecessary abstraction. Abyss was built for the deep—where memory has addresses, caches have line sizes, and code runs directly on the machine.

There are no hundred-page theoretical preambles here. Every chapter is short, code-first, and gets straight to the point.

---

## Table of Contents

### Part I: Overview
Get into the mindset behind the language and understand how the compiler works.
- [Philosophy](01-overview/philosophy.md) — Mechanical sympathy, zero hidden runtime, and control.
- [Architecture](01-overview/architecture.md) — The dual-engine design (VM + C99), data-oriented compiler, and bootstrapping.

### Part II: Quick Start
Start writing and running code in less than ten minutes.
- [Whirlwind Tour](02-quickstart/whirlwind-tour.md) — Syntax, types, control flow, structs, and compile-time execution at a glance.
- [Tooling & Workflow](02-quickstart/workflow.md) — Installing Abyss, running the VM with `abyssc`, managing packages with `sonar`, and formatting with `abyssfmt`.

### Part III: The Guide
A deep, code-first walkthrough of every language feature.
- [01 - Basics: Variables, Types, and Expressions](03-the-guide/01-basics.md) — Fixed-width numeric types, variables, mutability, operators, and string slices.
- [02 - Control Flow: Branching, Loops, and Matching](03-the-guide/02-control-flow.md) — `if/else` expressions, `while`, `for in` iteration, pattern matching, and `#fall`.
- [03 - Functions & Methods: Declarations and Receivers](03-the-guide/03-functions-and-methods.md) — Implicit tail returns, `ret`, struct method receivers (`self &Self`), and first-class function pointers.
- [04 - Structs & Types: Layout, Constructors, and Generics](03-the-guide/04-structs-and-types.md) — Transparent memory layout, struct literals `.{ ... }`, tagged unions, and deferred generic inference.
- [05 - Pointers & Memory: Addresses, Auto-Deref, and Arenas](03-the-guide/05-pointers-and-memory.md) — Direct memory addresses `&T`, seamless deep auto-dereference, and scoped arena allocations.
- [06 - Comptime & Metaprogramming: The VM, Splices, and Reflection](03-the-guide/06-comptime-and-metaprogramming.md) — Bytecode VM evaluation with `cmpt`, string splices `#`, raw string templates, and compile-time reflection.
- [07 - C Interoperability & Two-Way FFI](03-the-guide/07-c-interop.md) — Two-way C ABI, external function declarations, struct layout, and native header bindings.

### Part IV: Standard Library Reference
Comprehensive, authoritative API documentation for the standard pods.
- [01 - Core Primitives](04-reference/01-core.md) — Allocation-free `Str`, `Maybe(T)`, `Choice(T, E)`, `Slice(T)`, `Range`, and the zero-import prelude.
- [02 - Collections](04-reference/02-collections.md) — High-performance contiguous data structures: `Vec(T)`, `HashMap(K, V)`, `HashSet(T)`, and `Worklist(T)`.
- [03 - I/O & Formatting](04-reference/03-io-and-fmt.md) — Formatted console printing (`print`, `write`, `printf`), compile-time template engine `std/fmt`, and ANSI escapes.
- [04 - Filesystem & Paths](04-reference/04-fs-and-path.md) — High-level `File` operations, `FileStream` stream I/O, and cross-platform `Path` manipulation.
- [05 - Allocators & Memory](04-reference/05-allocators-and-mem.md) — Scoped `Arena` bump allocators, chunk management, and low-level `std/mem` heap primitives.
- [06 - System & Native Threading](04-reference/06-sys-and-threading.md) — OS process controls, 1:1 native kernel threads (`std/thread`), value captures, and `Mutex(T)` synchronization.

---

> *"Built for the deep."*
