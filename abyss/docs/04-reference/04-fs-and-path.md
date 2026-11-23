# Filesystem & Paths Reference: `std/fs` and `std/path`

The `std/fs` and `std/path` modules provide clean, cross-platform file system operations. They operate natively on Abyss's allocation-free `Str` type and integrate seamlessly with `Arena` memory management.

```abyss
File :: @import("std/fs").File
Path :: @import("std/path").Path
Arena :: @import("std/allocator").Arena

main :: fn() {
    arena := Arena.new(65536)

    -- 1. Combine paths portably
    log_path := Path.join(&arena, "logs", "app.log")

    -- 2. Write content directly
    File.write_string(log_path, "Application started\n")

    -- 3. Read content into an arena
    opt := File.read_to_string(&arena, log_path)
    if opt.is_some() {
        print(opt.unwrap())
    }

    arena.destroy()
}
```

---

## 1. High-Level File Operations (`File`)

The static `File` struct provides convenient single-call functions for reading, writing, and inspecting files:

### Reading Files

- `File.read_to_string(arena &Arena, path Str) Maybe(Str)`:  
  Reads the entire contents of a file into memory allocated within `arena`. Returns `none()` if the file does not exist or cannot be read.

```abyss
opt := File.read_to_string(&scratch, "config.json")
if opt.is_some() {
    content := opt.unwrap()
    print(content)
}
```

### Writing & Appending

- `File.write_string(path Str, content Str) bool`:  
  Creates or overwrites `path` with `content`. Returns `true` on success.
- `File.append_string(path Str, content Str) bool`:  
  Appends `content` to the end of `path`. Creates the file if it does not exist.

### Metadata & Manipulation

- `File.exists(path Str) bool`: Returns `true` if the path exists on disk.
- `File.size(path Str) u64`: Returns the size of the file in bytes.
- `File.delete(path Str) bool`: Removes the file from the filesystem.

---

## 2. Stream-Based I/O (`FileStream`)

For large files that cannot or should not be loaded into memory all at once, use `FileStream`:

```abyss
File :: @import("std/fs").File

process_large_file :: fn(path Str) {
    stream_opt := File.open_read(path)
    if stream_opt.is_none() {
        ret
    }

    stream := stream_opt.unwrap()

    -- Inspect size and position
    total_size := stream.size()
    print(total_size)

    -- Close the OS handle when finished
    stream.close()
}
```

### Complete `FileStream` API

- **Constructors**:
  - `File.open_read(path Str) Maybe(FileStream)`: Opens in read-only mode (`"rb"`).
  - `File.create(path Str) Maybe(FileStream)`: Creates or truncates for writing (`"wb"`).
  - `File.open_append(path Str) Maybe(FileStream)`: Opens for appending (`"ab"`).
- **Methods**:
  - `self.read(buf &u8, count u64) u64`: Reads up to `count` bytes into `buf`.
  - `self.write(buf &u8, count u64) u64`: Writes `count` bytes from `buf`.
  - `self.write_str(s Str) bool`: Writes a string slice to the stream.
  - `self.seek(offset i64, whence i32) bool`: Moves file position cursor.
  - `self.seek_to_start() bool`: Rewinds to byte offset 0.
  - `self.seek_to_end() bool`: Seeks to the end of the file.
  - `self.tell() i64`: Returns current byte cursor offset.
  - `self.size() u64`: Computes file size.
  - `self.close()`: Closes the underlying operating system file descriptor.

---

## 3. Path Manipulation (`Path`)

The `Path` module handles file path parsing, component extraction, and path joining across Windows, Linux, and macOS:

```abyss
Path :: @import("std/path").Path
Arena :: @import("std/allocator").Arena

main :: fn() {
    arena := Arena.new(4096)

    -- Joining components
    full_path := Path.join(&arena, "src", "compiler", "main.a")
    print(full_path)            -- "src/compiler/main.a"

    -- Decomposing paths
    dir := Path.dirname(full_path)
    base := Path.basename(full_path)
    ext := Path.extension(full_path)

    print(dir)                  -- "src/compiler"
    print(base)                 -- "main.a"
    print(ext)                  -- ".a"

    arena.destroy()
}
```

### Complete `Path` API

- `Path.join(arena &Arena, a Str, b Str) Str`: Joins two path components using the appropriate path separator.
- `Path.dirname(path Str) Str`: Extracts the directory containing the file.
- `Path.basename(path Str) Str`: Extracts the file name and extension.
- `Path.extension(path Str) Str`: Returns the file extension including the leading dot (`.`).
- `Path.is_absolute(path Str) bool`: Checks if the path is an absolute root path.

---

[← Previous: I/O & Formatting](03-io-and-fmt.md) | [Next: Allocators & Memory Reference →](05-allocators-and-mem.md)
