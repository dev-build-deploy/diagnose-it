/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import chalk from "chalk";

import { DiagnosticsLevelEnum, DiagnosticsMessage } from "../src/diagnosticsMessage";
import { FixItHint, ModificationType } from "../src/fixitHint";

// eslint-disable-next-line no-control-regex
const unchalk = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, "");

describe("Diagnostics Level Color", () => {
  const testData = [
    {
      description: "Ignored",
      level: DiagnosticsLevelEnum.Ignored,
      text: "ignored",
      color: chalk.bold.gray,
    },
    {
      description: "Remark",
      level: DiagnosticsLevelEnum.Remark,
      text: "remark",
      color: chalk.bold.blue,
    },
    {
      description: "Note",
      level: DiagnosticsLevelEnum.Note,
      text: "note",
      color: chalk.bold.blue,
    },
    {
      description: "Warning",
      level: DiagnosticsLevelEnum.Warning,
      text: "warning",
      color: chalk.bold.yellow,
    },
    {
      description: "Error",
      level: DiagnosticsLevelEnum.Error,
      text: "error",
      color: chalk.bold.red,
    },
    {
      description: "Fatal",
      text: "fatal",
      level: DiagnosticsLevelEnum.Fatal,
      color: chalk.bold.red,
    },
  ];

  testData.forEach(data => {
    test(data.description, () => {
      const msg = new DiagnosticsMessage({
        file: "test.ts",
        message: { text: "Subject", linenumber: 1, column: 1 },
      }).setLevel(data.level);
      expect(msg.toString()).toBe(chalk.bold("test.ts:1:1: ") + data.color(data.text + ": ") + chalk.bold("Subject"));
      console.log(msg.toString());
    });
  });
});

describe("Diagnostics Message boundaries", () => {
  const testData = [
    {
      description: "Minimal usage",
      input: {
        file: "test.ts",
        message: { text: "Subject", linenumber: 1, column: 1 },
      },
      expected: `test.ts:1:1: note: Subject`,
    },
    {
      description: "Negative line number",
      input: {
        file: "test.ts",
        message: { text: "Subject", linenumber: -1, column: 1 },
      },
      expected: undefined,
    },
    {
      description: "Negative column number",
      input: {
        file: "test.ts",
        message: { text: "Subject", linenumber: 1, column: -1 },
      },
      expected: undefined,
    },
    {
      description: "Message contains new lines",
      input: {
        file: "test.ts",
        message: { text: "This subject spans\nmultiple lines", linenumber: 1, column: 1 },
      },
      expected: undefined,
    },
    {
      description: "Filename contains new lines",
      input: {
        file: "test\n.ts",
        message: { text: "This subject spans\nmultiple lines", linenumber: 1, column: 1 },
      },
      expected: undefined,
    },
  ];

  testData.forEach(data => {
    test(data.description, () => {
      if (data.expected === undefined) {
        expect(() => {
          new DiagnosticsMessage(data.input);
        }).toThrowError();
        return;
      }
      const msg = new DiagnosticsMessage(data.input);
      expect(unchalk(msg.toString())).toBe(data.expected);
    });
  });
});

describe("Diagnostics Message context", () => {
  const testData = [
    {
      description: "Minimal usage",
      input: {
        file: "test.ts",
        message: { text: "Subject", linenumber: 1, column: 1 },
        context: { linenumber: 1, context: ["Line 1", "Line 2", "Line 3"] },
      },
      expected: `test.ts:1:1: note: Subject

1 | Line 1
  | ^
2 | Line 2
3 | Line 3`,
    },
    {
      description: "Variable linenumber widths",
      input: {
        file: "test.ts",
        message: { text: "Subject", linenumber: 99, column: 3 },
        context: { linenumber: 99, context: ["Line 1", "Line 2", "Line 3"] },
      },
      expected: `test.ts:99:3: note: Subject

 99 | Line 1
    |   ^
100 | Line 2
101 | Line 3`,
    },
    {
      description: "Caret on other line in context",
      input: {
        file: "test.ts",
        message: { text: "Subject", linenumber: 100, column: 6 },
        context: { linenumber: 99, context: ["Line 1", "Line 2", "Line 3"] },
      },
      expected: `test.ts:100:6: note: Subject

 99 | Line 1
100 | Line 2
    |      ^
101 | Line 3`,
    },
    {
      description: "Negative line number in Context",
      input: {
        file: "test.ts",
        message: { text: "Subject", linenumber: 99, column: 1 },
        context: { linenumber: -1, context: ["Line 1", "Line 2", "Line 3"] },
      },
      expected: undefined,
    },
    {
      description: "Context not matching line number of message",
      input: {
        file: "test.ts",
        message: { text: "Subject", linenumber: 2, column: 1 },
        context: { linenumber: 3, context: ["Line 1", "Line 2", "Line 3"] },
      },
      expected: undefined,
    },
  ];

  testData.forEach(data => {
    test(data.description, () => {
      const msg = new DiagnosticsMessage(data.input);
      if (data.expected === undefined) {
        expect(() => {
          msg.setContext(data.input.context.linenumber, data.input.context.context);
        }).toThrow();
        return;
      }
      msg.setContext(data.input.context.linenumber, data.input.context.context);
      expect(unchalk(msg.toString())).toBe(data.expected);

      console.log(msg.toString());
    });
  });
});

describe("FixIt Hints (incl. applying fixes)", () => {
  const testData = [
    {
      description: "Highlight a single character",
      input: {
        file: "test.ts",
        message: { text: "Generic error", linenumber: 100, column: 4 },
        context: { linenumber: 99, context: ["Line 1", "Lino 2", "Line 3"] },
        fixit: { modification: "DEFAULT", index: 4, length: 1 },
      },
      fixed: `Lino 2`,
      expected: `test.ts:100:4: note: Generic error

 99 | Line 1
100 | Lino 2
    |    ~
101 | Line 3`,
    },
    {
      description: "Highlight multiple character(s)",
      input: {
        file: "test.ts",
        message: { text: "Generic error", linenumber: 100, column: 1 },
        context: { linenumber: 99, context: ["Line 1", "eniL 2", "Line 3"] },
        fixit: { modification: "DEFAULT", index: 1, length: 4 },
      },
      fixed: `eniL 2`,
      expected: `test.ts:100:1: note: Generic error

 99 | Line 1
100 | eniL 2
    | ~~~~
101 | Line 3`,
    },
    {
      description: "Replace single character",
      input: {
        file: "test.ts",
        message: { text: "Replace character(s)", linenumber: 100, column: 6 },
        context: { linenumber: 99, context: ["Line 1", "Line 4", "Line 3"] },
        fixit: { modification: "REPLACE", index: 6, length: 1, text: "2" },
      },
      fixed: `Line 2`,
      expected: `test.ts:100:6: note: Replace character(s)

 99 | Line 1
100 | Line 4
    |      ^
    |      2
101 | Line 3`,
    },
    {
      description: "Replace character range",
      input: {
        file: "test.ts",
        message: { text: "Replace character(s)", linenumber: 100, column: 1 },
        context: { linenumber: 99, context: ["Line 1", "Foo 2", "Line 3"] },
        fixit: { modification: "REPLACE", index: 1, length: 3, text: "Line" },
      },
      fixed: `Line 2`,
      expected: `test.ts:100:1: note: Replace character(s)

 99 | Line 1
100 | Foo 2
    | ^~~
    | Line
101 | Line 3`,
    },
    {
      description: "Remove single character",
      input: {
        file: "test.ts",
        message: { text: "Incorrect character(s)", linenumber: 100, column: 3 },
        context: { linenumber: 99, context: ["Line 1", "Liine 2", "Line 3"] },
        fixit: { modification: "REMOVE", index: 3, length: 1 },
      },
      fixed: `Line 2`,
      expected: `test.ts:100:3: note: Incorrect character(s)

 99 | Line 1
100 | Liine 2
    |   ^
101 | Line 3`,
    },
    {
      description: "Remove range of characters",
      input: {
        file: "test.ts",
        message: { text: "Incorrect character(s)", linenumber: 100, column: 3 },
        context: { linenumber: 99, context: ["Line 1", "Liiiine 2", "Line 3"] },
        fixit: { modification: "REMOVE", index: 3, length: 3 },
      },
      fixed: `Line 2`,
      expected: `test.ts:100:3: note: Incorrect character(s)

 99 | Line 1
100 | Liiiine 2
    |   ^~~
101 | Line 3`,
    },
    {
      description: "Insert a single character",
      input: {
        file: "test.ts",
        message: { text: "Missing character(s)", linenumber: 100, column: 4 },
        context: { linenumber: 99, context: ["Line 1", "Lin 2", "Line 3"] },
        fixit: { modification: "INSERT", index: 4, length: 1, text: "e" },
      },
      fixed: `Line 2`,
      expected: `test.ts:100:4: note: Missing character(s)

 99 | Line 1
100 | Lin 2
    |    ^
    |    e
101 | Line 3`,
    },
    {
      description: "Insert multiple characters",
      input: {
        file: "test.ts",
        message: { text: "Missing character(s)", linenumber: 100, column: 4 },
        context: { linenumber: 99, context: ["Line 1", "Lin", "Line 3"] },
        fixit: { modification: "INSERT", index: 4, length: 1, text: "e 2" },
      },
      fixed: `Line 2`,
      expected: `test.ts:100:4: note: Missing character(s)

 99 | Line 1
100 | Lin
    |    ^
    |    e 2
101 | Line 3`,
    },
  ];

  // Run test for each testData
  testData.forEach(data => {
    test(data.description, () => {
      const msg = new DiagnosticsMessage(data.input)
        .setContext(data.input.context.linenumber, data.input.context.context)
        .addFixitHint(
          new FixItHint(
            data.input.fixit.modification as ModificationType,
            { index: data.input.fixit.index, length: data.input.fixit.length },
            data.input.fixit.text
          )
        );
      expect(unchalk(msg.toString())).toBe(data.expected);
      expect(msg.applyFixitHints()).toBe(data.fixed);
      expect(msg.getFixitHints().length).toBe(1);
      expect(msg.getFixitHints()[0].modification).toBe(data.input.fixit.modification as ModificationType);

      console.log(msg.toString());
    });
  });
});
