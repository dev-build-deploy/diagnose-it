<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
-->

# DiagnoseIt - Expressive Diagnostics Library

Lightweight diagnostics logger, based on [LLVMs Expressive Diagnostics specification]:

<img src="./docs/example.svg" width="100%">


## Features

* Simple to use
* Inspired by the [LLVMs Expressive Diagnostics specification]
* Provide context to your diagnostics messages

## Usage

### Create an Expressive Diagnostics message

```ts
import { DiagnosticsMessage, FixItHint } from '@dev-build-deploy/diagnose-it';
const lines = `steps:
  - uses: actions/checkout@v2
  - neds: [build, test]
    - uses: actions/setup-node@v2`;
  
// Example use case
const message = DiagnosticsMessage.createError(
  "example.yaml",
  {
    text: "Invalid keyword 'neds'",
    linenumber: 9,
    column: 5
  }
)
  // Add context to the diagnostics message
  .setContext(7, lines)
  // Add a FixIt Hint
  .addFixitHint(FixItHint.createReplacement({ index: 5, length: 4 }, "needs"));

// Convert to string
console.log(message.toString());

// Apply FixIt Hints
console.log("Results after applying FixIt Hints:", message.applyFixitHints());

// Throw as an Error
throw message;
```

### Parse a file

You can parse a (compiler output) file to retrieve any Expressive Diagnostic message:

```ts
import * as diagnoseIt from '@dev-build-deploy/diagnose-it';

for await(const message of diagnoseIt.extractFromFile("build.log")) {
  if (message.toJSON().type === "error") {
    // Oh noes!
  }
}
```

> **NOTE**: Any `.sarif` or `.sarif.json` file will be parsed for valid SARIF results content

## Output format

`DiagnoseIt` is inspired by the [LLVMs Expressive Diagnostics formatting](https://clang.llvm.org/diagnostics.html);

<img src="./docs/formatting.svg">

*However, it does not aim to provide full compatibility.*

## Contributing

If you have suggestions for how `DiagnoseIt` could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

- [MIT](./LICENSES/MIT.txt) © 2023 Kevin de Jong \<monkaii@hotmail.com\>


[LLVMs Expressive Diagnostics specification]: https://clang.llvm.org/diagnostics.html
