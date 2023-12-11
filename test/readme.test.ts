/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { DiagnosticsMessage, FixItHint } from "../src/index.js";

import { jest } from "@jest/globals";

import fs from "fs";

jest.mock("fs", () => ({
  promises: {
    access: jest.fn(),
  },
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

describe("ReadMe tests", () => {
  test("Example code", () => {
    const fileContents = `name: Example Workflow

jobs:
  example-run:
    name: Example failure
    runs-on: ubuntu-latest
    neds: [build, test]
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2`;

    const expected = `name: Example Workflow

jobs:
  example-run:
    name: Example failure
    runs-on: ubuntu-latest
    needs: [build, test]
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2`;

    jest.spyOn(fs, "readFileSync").mockImplementation(() => fileContents);
    jest.spyOn(fs, "existsSync").mockImplementation(() => false);

    const lines = fileContents.split(/\r?\n/).splice(4, 5);

    // Example use case
    const message = DiagnosticsMessage.createError("example.yaml", {
      text: "Invalid keyword 'neds'",
      linenumber: 7,
      column: 5,
    })
      // Add context to the diagnostics message
      .setContext(5, lines)
      // Add a FixIt Hint
      .addFixitHint(FixItHint.createReplacement({ index: 5, length: 4 }, "needs"));

    // Convert to string
    console.log(message.toString());

    // Apply FixIt Hints
    console.log("Results after applying FixIt Hints:", message.applyFixitHints());

    expect(message.applyFixitHints()).toBe(expected);
  });
});
