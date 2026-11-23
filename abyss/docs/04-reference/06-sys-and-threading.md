# System & Threading Reference: `std/sys` and `std/thread`

The `std/sys` and `std/thread` modules give Abyss direct access to host operating system facilities, process control, and native 1:1 kernel threads.

Abyss has no runtime scheduler, green thread machinery, or hidden thread pools. When you spawn a thread, it maps directly to a lightweight native OS thread (POSIX `pthread` on Linux/macOS, Win32 threads on Windows).

```abyss
thread :: @import("std/thread")

Job :: struct {
    start u64
    count u64
}

sum_range :: fn(job Job) u64 {
    total: u64 = 0
    i := job.start
    while i < job.start + job.count {
        total = total + i
        i = i + 1
    }
    total
}

main :: fn() {
    job: Job = .{ start: 1, count: 1000 }

    -- Spawn worker with value capture
    handle := thread.spawn_with(sum_range, job).unwrap()

    -- Wait and collect typed result
    result := handle.join().unwrap()
    print(result)
}
```

---

## 1. System Primitives (`std/sys`)

The `std/sys` module provides low-level process controls and standard I/O streams:

### Process Control
- `sys.exit_process(code i32)`: Immediately terminates the current process with an exit status code.
- `sys.fall`: Macro that prints the current `@source_location()` to `stderr` and terminates the process with status 1.

### Standard Stream Descriptors
- `sys.STDIN`: Standard input descriptor (`0`).
- `sys.STDOUT`: Standard output descriptor (`1`).
- `sys.STDERR`: Standard error descriptor (`2`).
- `sys.write_console(text Str)`: Writes directly to standard output.
- `sys.write_stderr(text Str)`: Writes directly to standard error.

---

## 2. Spawning Native Threads (`std/thread`)

Worker callbacks in Abyss are ordinary typed functions. Spawning functions check captures and return types recursively at compile time to guarantee thread safety.

### Spawning Variants

1. **`thread.spawn(work fn() R) Result(Thread(R))`**:  
   Runs a function with zero arguments.
2. **`thread.spawn_with(work fn(T) R, capture T) Result(Thread(R))`**:  
   Copies `capture` by value into the thread job. The capture must be **pointer-free** (scalars, arrays, and value structs; pointers, slices, and `Str` are rejected at compile time).
3. **`thread.spawn_shared(work fn(&T) R, state &T) Result(Thread(R))`**:  
   Explicitly permits passing borrowed state across threads. The programmer is responsible for ensuring `state` outlives the worker.
4. **`thread.spawn_detached(work fn(T), capture T) Result(Unit)`**:  
   Spawns a background task that runs independently. The worker frees its own job upon completion without needing a `join()`.

---

## 3. Joining and Thread Lifecycle

A `Thread(R)` handle represents a single-owner capability to wait on a worker:

```abyss
handle := thread.spawn_with(compute, data).unwrap()

-- Block until worker completes and retrieve typed return value:
res := handle.join()
if res.is_success() {
    print(res.unwrap())
}
```

### Thread Control

- `thread.sleep(milliseconds u32) Result(Unit)`:  
  Suspends execution of the calling thread for the specified duration without busy-waiting.
- `thread.yield()`:  
  Relinquishes the current thread's remaining timeslice to the OS scheduler.

---

## 4. Mutex Synchronization (`Mutex(T)`)

`Mutex(T)` encapsulates a typed value protected by a native operating system mutual exclusion lock:

```abyss
thread :: @import("std/thread")
Mutex :: @import("std/thread").Mutex

Counter :: struct {
    value i32
}

main :: fn() {
    -- Create a mutex protecting a Counter
    lock := Mutex(Counter).new(.{ value: 0 })

    -- Acquire reference to protected data
    ptr := lock.lock()
    ptr.value = ptr.value + 1
    lock.unlock()

    -- Or safely execute a block with automatic unlock:
    lock.with_lock(fn(c &Counter) {
        c.value = c.value + 10
    })

    -- Release native lock when completely done
    lock.destroy()
}
```

### Complete `Mutex(T)` API

- `Mutex(T).new(initial_val T) Mutex(T)`: Allocates a new native mutex lock protecting `initial_val`.
- `self.lock() &T`: Blocks until the lock is acquired and returns a mutable pointer to the inner data.
- `self.unlock()`: Releases the lock.
- `self.try_lock() Maybe(&T)`: Non-blocking attempt; returns `some(&T)` if acquired immediately, or `none()` if contested.
- `self.with_lock(work fn(&T) R) R`: Acquires lock, passes `&T` to `work`, and unlocks automatically upon return.
- `self.destroy()`: Destroys the underlying OS mutex lock.

---

## 5. Platform Support & Linking

- `thread.supported` is a compile-time boolean constant. Threads are fully supported on **Linux**, **macOS**, and **Windows**.
- WASI and freestanding targets do not support native threads.
- When compiling native C output manually on POSIX targets, ensure `-pthread` is passed to the C compiler/linker:
  ```sh
  abyssc b main.a out.c
  gcc -pthread -O3 out.c -o main
  ```
  *(When compiling via `sonar build`, `-pthread` is linked automatically on supported platforms.)*

---

[← Previous: Allocators & Memory](05-allocators-and-mem.md) | [Back to Table of Contents →](../README.md)
