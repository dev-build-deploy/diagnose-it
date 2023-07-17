/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import assert from "assert";

// Supported expressive types
type ExpressiveType = "error" | "warning" | "note";

/**
 * Caret (^) position and length
 * @interface ICaret
 * @member index Index of the caret (^)
 * @member length Length of the caret (^)
 */
interface ICaret {
  index: number;
  length: number;
}

/**
 * Context around the error
 * @interface IContext
 * @member index Starting line number of the reported message
 * @member lines Lines around the reported message
 */
interface IContext {
  index: number;
  lines: string[];
}

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
  caret?: ICaret;
  hint?: string;
  context?: IContext;
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
 * @function caret Caret position and length
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
  private _caret: ICaret = { index: 0, length: 0 };
  private _hint?: string;
  private _context?: IContext;

  constructor(message?: IExpressiveMessage) {
    super();

    if (message) {
      this.id(message.id);
      switch (message.type) {
        case "error":
          this.error(message.message);
          break;
        case "warning":
          this.warning(message.message);
          break;
        case "note" || undefined:
          this.note(message.message);
          break;
      }
      this.lineNumber(message.lineNumber ?? 0);
      if (message.context !== undefined) this.context(message.context.lines, message.context.index);
      this.caret(message.caret?.index ?? 0, message.caret?.length ?? 0);
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
    if (lineNumber < 0) throw new RangeError("Line number must be greater or equal to 0.");
    this._lineNumber = lineNumber;
    this.update();
    return this;
  }

  /**
   * Updates the caret associated with the message.
   * @param columnNumber Line number
   * @param length Length of the caret
   * @returns this
   */
  caret(columnNumber: number, length?: number): this {
    if (columnNumber < 0) throw new RangeError("Column number must be greater or equal to 0.");
    if (length !== undefined && length < 0) throw new RangeError("Caret length must be greater or equal to 0.");

    this._caret = {
      index: columnNumber,
      length: length ?? 0,
    };
    this.update();
    return this;
  }

  /**
   * Updates the hint associated with the message.
   * @param hint Hint
   * @returns this
   */
  hint(hint: string): this {
    this._hint = hint;
    this.update();
    return this;
  }

  /**
   * Updates the context (lines around the reposted message) associated with the message.
   * @param lines Lines around the reported message
   * @param start Start index of the reported message
   * @returns this
   */
  context(lines: string | string[], start: number): this {
    if (start < 0) throw new RangeError("Initial line number must be greater or equal to 0.");

    if (typeof lines === "string") lines = lines.split("\n");
    this._context = { index: start, lines: lines.length > 0 ? lines : [] };
    this.update();
    return this;
  }

  /**
   * Updates the Expressive Diagnostics message.
   */
  private update() {
    const GREEN = "\x1b[0;32m";
    const RED = "\x1b[1;31m";

    this.message = `\x1b[1m${this._id}:${this._lineNumber}:${this._caret.index}: ${
      this._type === "error" ? RED : GREEN
    }${this._type}:\x1b[0m\x1b[1m ${this._message}\x1b[0m`;
    if (this._context === undefined) return;
    this.message += "\n\n";

    const maxWidth = (this._context.index + this._context.lines.length).toString().length;

    this._context.lines.forEach((line, index) => {
      assert(this._context);
      const lineNumber = this._context.index + index;
      let formattedLine = `  ${" ".repeat(maxWidth - lineNumber.toString().length)}${lineNumber} | ${line}\n`;

      if (this._lineNumber !== lineNumber) formattedLine = `\u001b[38;5;245m${formattedLine}\u001b[0m`;

      this.message += formattedLine;

      if (this._lineNumber === lineNumber) {
        this.message += `  ${" ".repeat(maxWidth)} | ${" ".repeat(this._caret.index)}\u001b[32;1m^${"-".repeat(
          this._caret.length > 0 ? this._caret.length - 1 : 0
        )}\u001b[0m\n`;

        if (this._hint !== undefined) {
          this.message += `  ${" ".repeat(maxWidth)} | ${" ".repeat(this._caret.index)}${this._hint}\n`;
        }
      }
    });
  }

  /**
   * Generates an Expressive Diagnostics message in formatted output.
   * @returns Formatted message
   */
  toString() {
    if (this._context !== undefined) {
      if (this._lineNumber < this._context.index || this._lineNumber > this._context.index + this._context.lines.length)
        throw new RangeError(
          `Line number (${this._lineNumber}) does not exist in provided context (lines ${this._context.index}-${
            this._context.index + this._context.lines.length
          }).`
        );
    }
    if (this._id === undefined) throw new Error("No identifier (i.e. filename) has been provided.");
    if (this._message === undefined) throw new Error("No message has been specified.");
    if (this._hint && this._caret === undefined) throw new Error("Cannot specify a hint without a caret.");

    return this.message;
  }
}
