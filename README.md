<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# DiagnoseIt - Expressive Diagnostics Library

Lightweight diagnostics logger, based on [LLVMs Expressive Diagnostics specification]:

<img src="./docs/example.svg" width="100%">


## Features

* Simple to use
* Based on [LLVMs Expressive Diagnostics specification]
* Provide context to your diagnostics messages

## Usage

```ts
import { ExpressiveMessage } from 'diagnose-it';

const lines = `steps:
  - uses: actions/checkout@v2
  - neds: [build, test]
    - uses: actions/setup-node@v2`;

// Example using Method chaining
const chainedMessage = new ExpressiveMessage()
  .id("example.yaml")
  .error("Invalid keyword 'neds'")
  .lineNumber(9)
  .columnNumber(4)
  .context(lines, 7, 4);

// Example using constructor
const message = new ExpressiveMessage({
  id: "example.yaml",
  type: "error",
  message: "Invalid keyword 'neds'",
  lineNumber: 9
  columnNumber: 4
  context: {
    lines: lines,
    index: 7,
    length: 4
  }
});

// Convert to string
console.log(chainedMessage.toString());

// Throw as an Error
throw message;
```

## Contributing

If you have suggestions for how diagnose-it could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

- [GPL-3.0-or-later, CC0-1.0](LICENSE) © 2023 Kevin de Jong \<monkaii@hotmail.com\>


[LLVMs Expressive Diagnostics specification]: https://clang.llvm.org/diagnostics.html