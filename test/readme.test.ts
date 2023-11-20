/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { DiagnosticsMessage, FixItHint } from "../src/index";

describe("ReadMe tests", () => {
  test("Example code", () => {
    const lines = `steps:
  - uses: actions/checkout@v2
  - neds: [build, test]
    - uses: actions/setup-node@v2`;

    // Example use case
    const message = DiagnosticsMessage.createError("example.yaml", {
      text: "Invalid keyword 'neds'",
      linenumber: 9,
      column: 5,
    })
      // Add context to the diagnostics message
      .setContext(7, lines)
      // Add a FixIt Hint
      .addFixitHint(FixItHint.createReplacement({ index: 5, length: 4 }, "needs"));

    // Convert to string
    console.log(message.toString());

    // Apply FixIt Hints
    console.log("Results after applying FixIt Hints:", message.applyFixitHints());

    expect(message.applyFixitHints()).toBe("  - needs: [build, test]");
  });
});
