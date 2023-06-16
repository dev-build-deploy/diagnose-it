/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { ExpressiveMessage } from "../src/index";

/**
 * Remove ANSI Color codes from string
 */
// eslint-disable-next-line no-control-regex
const removeColorCodes = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, "");

describe("Expressive Message", () => {
  test("Minimal usage", () => {
    expect(removeColorCodes(new ExpressiveMessage().id("example").error("Subject").toString())).toBe(
      "example:0:0: error: Subject"
    );
    expect(
      removeColorCodes(new ExpressiveMessage({ id: "example", message: "Subject", type: "error" }).toString())
    ).toBe("example:0:0: error: Subject");
  });

  test("Required parameters", () => {
    expect(() => {
      new ExpressiveMessage().toString();
    }).toThrowError();
    expect(() => {
      new ExpressiveMessage().id("example").toString();
    }).toThrowError();
    expect(() => {
      new ExpressiveMessage().error("Subject").toString();
    }).toThrowError();
  });

  test("Supported message types (error|warning|note)", () => {
    expect(removeColorCodes(new ExpressiveMessage().id("example").error("Subject").toString())).toBe(
      "example:0:0: error: Subject"
    );
    expect(removeColorCodes(new ExpressiveMessage().id("example").note("Subject").toString())).toBe(
      "example:0:0: note: Subject"
    );
    expect(removeColorCodes(new ExpressiveMessage().id("example").warning("Subject").toString())).toBe(
      "example:0:0: warning: Subject"
    );
  });

  test("Context", () => {
    let message = new ExpressiveMessage()
      .id("example")
      .error("Subject")
      .lineNumber(6)
      .caret(0, 4)
      .context("Line 1\nLine 2\nLine 3", 5);
    expect(removeColorCodes(message.toString())).toBe(`example:6:0: error: Subject

  5 | Line 1
  6 | Line 2
    | ^---
  7 | Line 3
`);
    message = new ExpressiveMessage()
      .id("example")
      .error("Subject")
      .lineNumber(99)
      .caret(0, 4)
      .context("Line 1\nLine 2\nLine 3", 99);
    expect(removeColorCodes(message.toString())).toBe(`example:99:0: error: Subject

   99 | Line 1
      | ^---
  100 | Line 2
  101 | Line 3
`);
  });

  test("Line number out of bounds", () => {
    expect(() => {
      new ExpressiveMessage({
        id: "example",
        message: "Subject",
        type: "error",
        lineNumber: 0,
        caret: { index: 0, length: 4 },
        context: { index: 10, lines: ["Line 1", "Line 2", "Line 3"] },
      }).toString();
    }).toThrowError();
  });

  test("Zero length context", () => {
    expect(() => {
      new ExpressiveMessage({
        id: "example",
        message: "Subject",
        type: "error",
        lineNumber: 0,
        caret: { index: 0, length: 0 },
        context: { index: 0, lines: ["Line 1", "Line 2", "Line 3"] },
      }).toString();
    }).not.toThrowError();
  });

  test("Caret out of bounds", () => {
    expect(() => {
      new ExpressiveMessage({
        id: "example",
        message: "Subject",
        type: "error",
        lineNumber: -1,
        caret: { index: -1, length: -1 },
        context: { index: -1, lines: ["Line 1"] },
      });
    }).toThrowError();

    expect(() => {
      new ExpressiveMessage({
        id: "example",
        message: "Subject",
        type: "error",
        lineNumber: 0,
        caret: { index: 10, length: 4 },
        context: { index: 0, lines: ["Line 1"] },
      }).toString();
    }).not.toThrowError();
  });

  test("Fix-it Hint", () => {
    const message = new ExpressiveMessage()
      .id("example")
      .error("Subject")
      .lineNumber(99)
      .caret(0, 4)
      .hint("Line")
      .context("Fony 1\nLine 2\nLine 3", 99);

    expect(removeColorCodes(message.toString())).toBe(`example:99:0: error: Subject

   99 | Fony 1
      | ^---
      | Line
  100 | Line 2
  101 | Line 3
`);
  });
});
