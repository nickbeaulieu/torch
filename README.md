# torch 🔥

it's a systems programming language that compiles to C. it supports some higher-level syntaxes that make programming it friendlier, while still being relatively easy to generate the relevant C.

- methods on a struct (traits?)
- function & (trait?) overloading
- `and` / `or` / `in` keywords
- `defer`
- ranges like `for i in 0..10 {...`
- `out` / `ref` to pass by reference from c#
- `guard` from swift
- pattern matching with `[variable] switch`

## types

`null`
`bool`

| signed        | unsigned       |
| ------------- | -------------- |
| `i8`          | `u8`           |
| `i16`         | `u16`          |
| `i32` (`int`) | `u32` (`uint`) |
| `i64`         | `u64`          |

`f32` || `f64`

'a' `char`
"a" `str`

```go
let = 9;
a switch {
  3 => { print("hello") }
  _ => {}
}
```

std library will offer heap memory allocation tools to work with arrays, etc., but the language itself is not guaranteed to be safe.

- unit testing
- documentation generator

## TODO

- [x] basic typing system
- [x] static arrays
- [x] turing-complete
- [ ] function parameters
- [ ] error reporting
- [ ] import from another file
- [ ] static type checking
  - [ ] type inference
- [ ] struct
- [ ] traits (essentially methods on a struct)
- [ ] dynamic strings and arrays
