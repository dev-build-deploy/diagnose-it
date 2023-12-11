/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { jest } from "@jest/globals";

import { DiagnosticsLevelEnum, DiagnosticsMessage } from "../src/diagnosticsMessage.js";
import { applyPatch, createPatch } from "../src/diff.js";
import { FixItHint } from "../src/fixitHint.js";

import fs from "fs";

jest.mock("fs", () => ({
  promises: {
    access: jest.fn(),
  },
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

describe("Create and Apply Patch", () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const testData = [
    {
      description: "No FixIt hints",
      patch: `--- example.py 01/01/2020, 00:00:00
+++ example.py.fix 01/01/2020, 00:00:00
@@ -1,3 +1,3 @@
 Line 1
 Line 2
 Line 3`,
      fix: `Line 1
Line 2
Line 3`,
    },
    {
      description: "Single Insertion FixIt hint",
      fixit: [FixItHint.createInsertion(1, "First ")],
      patch: `--- example.py 01/01/2020, 00:00:00
+++ example.py.fix 01/01/2020, 00:00:00
@@ -1,3 +1,3 @@
-Line 1
+First Line 1
 Line 2
 Line 3`,
      fix: `First Line 1
Line 2
Line 3`,
    },
    {
      description: "Single Removal FixIt hint",
      fixit: [FixItHint.createRemoval({ index: 5, length: 2 })],
      patch: `--- example.py 01/01/2020, 00:00:00
+++ example.py.fix 01/01/2020, 00:00:00
@@ -1,3 +1,3 @@
-Line 1
+Line
 Line 2
 Line 3`,
      fix: `Line
Line 2
Line 3`,
    },
    {
      description: "Single Replacement FixIt hint",
      fixit: [FixItHint.createReplacement({ index: 1, length: 6 }, "First")],
      patch: `--- example.py 01/01/2020, 00:00:00
+++ example.py.fix 01/01/2020, 00:00:00
@@ -1,3 +1,3 @@
-Line 1
+First
 Line 2
 Line 3`,
      fix: `First
Line 2
Line 3`,
    },
    {
      description: "Multiple FixIt hints",
      fixit: [FixItHint.createInsertion(1, "First "), FixItHint.createRemoval({ index: 5, length: 2 })],
      patch: `--- example.py 01/01/2020, 00:00:00
+++ example.py.fix 01/01/2020, 00:00:00
@@ -1,3 +1,3 @@
-Line 1
+First Line
 Line 2
 Line 3`,
      fix: `First Line
Line 2
Line 3`,
    },
  ];

  testData.forEach(({ description, fixit, patch, fix }) => {
    test(description, () => {
      const fileContents = `Line 1
Line 2
Line 3`;
      jest.spyOn(fs, "readFileSync").mockImplementation(() => fileContents);
      jest.spyOn(fs, "existsSync").mockImplementation(() => false);

      const message = new DiagnosticsMessage({
        file: "example.py",
        level: DiagnosticsLevelEnum.Error,
        message: { text: description, linenumber: 1, column: 1 },
      });

      message.setContext(1, fileContents);

      if (fixit) {
        fixit.forEach(hint => message.addFixitHint(hint));
      }
      const patchResults = createPatch(message);

      expect(patchResults).toBe(patch);
      expect(applyPatch(patchResults)).toBe(fix);
    });
  });
});
