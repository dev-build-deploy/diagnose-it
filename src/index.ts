/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as path from "path";
import assert from "assert";

// Supported expressive types
type ExpressiveType = "error" | "warning" | "note";

/**
 * Expressive Diagnostics message interface
 * @interface IExpressiveMessage
 * @member id Identifier (i.e. filename)
 * @member type Type of message
 * @member message Message
 * @member lineNumber Line number
 * @member columnNumber Column number
 * @member context Context around the error
 */
interface IExpressiveMessage {
  id: string;
  type?: ExpressiveType;
  message: string;
  lineNumber?: number;
  columnNumber?: number;
  context?: {
    index: number;
    length: number;
    lines: string[];
  };
}

/**
 * Expressive Diagnostics message
 *
 * Example:
 *   workflow.yaml:9:7: error: Invalid keyword 'neds'
 *
 *     7 |   steps:
 *     8 |     - uses: actions/checkout@v2
 *     9 |       neds: [build, test]
 *       |       ^---
 *    10 |     - uses: actions/setup-node@v2
 *    11 |       with:
 *
 * The format is loosely baed onthe LLVM "Expressive Diagnostics" specification, with
 * additional support for context.
 *
 * @class ExpressiveMessage
 * @function id Identifier (i.e. filename)
 * @function error Error message
 * @function warning Warning message
 * @function note Information message
 * @function lineNumber Line number
 * @function columnNumber Column number
 * @function context Context around the error
 * @function toString Returns the formatted message
 *
 * @see https://clang.llvm.org/docs/ClangFormatStyleOptions.html#expressive-diagnostic-formatting
 */
export class ExpressiveMessage extends Error {
  private _id?: string = undefined;
  private _type: ExpressiveType = "note";
  private _message?: string = undefined;
  private _lineNumber = 0;
  private _columnNumber = 0;
  private _context?: {
    index: number;
    length: number;
    lines: string[];
  };

  constructor(message?: IExpressiveMessage) {
    super();

    if (message) {
      this._id = message.id;
      this._message = message.message;
      this._type = message.type ?? "note";
      this._lineNumber = message.lineNumber ?? 0;
      this._columnNumber = message.columnNumber ?? 0;
      this._context = message.context;
      this.update();
    }
  }

  /**
   * Updates the Expressive Diagnostics message identifier (i.e. filename).
   * @param id Identifier (i.e. filename)
   * @returns this
   */
  id(id: string): this {
    this._id = id;
    this.update();
    return this;
  }

  /**
   * Updates the Expressive Diagnostics message and marks it as 'error'.
   * @param message Error message
   * @returns this
   */
  error(message: string): this {
    this._message = message;
    this._type = "error";
    this.update();
    return this;
  }

  /**
   * Updates the Expressive Diagnostics message and marks it as 'note'.
   * @param message Info message
   * @returns this
   */
  note(message: string): this {
    this._message = message;
    this._type = "note";
    this.update();
    return this;
  }

  /**
   * Updates the Expressive Diagnostics message and marks it as 'warning'.
   * @param message Warning message
   * @returns this
   */
  warning(message: string): this {
    this._message = message;
    this._type = "warning";
    this.update();
    return this;
  }

  /**
   * Updates the line number associated with the message.
   * @param lineNumber Line number
   * @returns this
   */
  lineNumber(lineNumber: number): this {
    this._lineNumber = lineNumber;
    this.update();
    return this;
  }

  /**
   * Updates the column number associated with the message.
   * @param columnNumber Line number
   * @returns this
   */
  columnNumber(columnNumber: number): this {
    this._columnNumber = columnNumber;
    this.update();
    return this;
  }

  /**
   * Updates the context (lines around the reposted message) associated with the message.
   * @param lines Lines around the reported message
   * @param start Start index of the reported message
   * @param length Length of the reported message
   * @returns this
   */
  context(lines: string | string[], start: number, length = 0): this {
    if (typeof lines === "string") lines = lines.split("\n");
    this._context = { index: start, lines: lines, length: length };
    this.update();
    return this;
  }

  /**
   * Updates the Expressive Diagnostics message.
   */
  private update() {
    const GREEN = "\x1b[0;32m";
    const RED = "\x1b[1;31m";

    this.message = `\x1b[1m${this._id}:${this._lineNumber}:${this._columnNumber}: ${
      this._type === "error" ? RED : GREEN
    }${this._type}:\x1b[0m\x1b[1m ${this._message}\x1b[0m`;
    if (this._context === undefined) return;
    this.message += "\n\n";

    const maxWidth = (this._context.index + this._context.lines.length).toString().length;

    this._context.lines.forEach((line, index) => {
      assert(this._context);
      const lineNumber = this._context.index + index;
      let formattedLine = `  ${" ".repeat(maxWidth - lineNumber.toString().length)}${lineNumber} | ${line}\n`;

      if (this._lineNumber !== lineNumber) {
        formattedLine = `\u001b[38;5;245m${formattedLine}\u001b[0m`;
      }
      this.message += formattedLine;

      if (this._columnNumber !== undefined && this._lineNumber === lineNumber) {
        this.message += `  ${" ".repeat(maxWidth)} | ${" ".repeat(this._columnNumber)}\u001b[32;1m^${"-".repeat(
          this._context.length - 1
        )}\u001b[0m\n`;
      }
    });
  }

  /**
   * Resets all internal variables.
   * @returns this
   */
  private reset(): this {
    this._id = undefined;
    this._type = "note";
    this._message = undefined;
    this._lineNumber = 0;
    this._columnNumber = 0;
    this.message = "";
    return this;
  }

  /**
   * Generates an Expressive Diagnostics message in formatted output.
   * @returns Formatted message
   */
  toString(): string {
    let error: ExpressiveMessage | undefined = undefined;

    if (this._id === undefined) {
      error = this.reset().error("No identifier (i.e. filename) has been provided.");
    } else if (this._message === undefined) {
      error = this.reset().error("No message has been specified.");
    } else if (
      this._context !== undefined &&
      (this._lineNumber < this._context.index || this._lineNumber > this._context.index + this._context.lines.length)
    ) {
      error = this.reset().error("Line number is out of range.");
    }

    // We will throw an Expressive Diagnostics message using the original stack trace.
    // However, this will require us to update the current instance and reconstruct
    // the stack trace.
    if (error !== undefined) {
      const stackRegex = /at\s(.*)\s\((?<file>.*):(?<line>\d*):(?<col>\d*)\)/g;
      assert(this.stack);

      const match = stackRegex.exec(this.stack);
      assert(match && match.groups && match.groups.file);

      error = error
        .id(path.relative(path.resolve(), match?.groups?.file))
        .lineNumber(parseInt(match?.groups?.line ?? "0"))
        .columnNumber(parseInt(match?.groups?.col ?? "0"));

      assert(error.stack);
      error.stack = error.stack.replace(/.*$/m, error.message);

      throw error;
    }
    return this.message;
  }
}
