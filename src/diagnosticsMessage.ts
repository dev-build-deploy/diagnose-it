/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import chalk from "chalk";
import { FixItHint, ModificationColorCodes } from "./fixitHint";

/**
 * Diagnostics Message Level
 * @enum {number}
 *
 * @example
 * ```typescript
 * const level = DiagnosticsLevelEnum.Error;
 * console.log(level); // 4
 * console.log(DiagnosticsLevelEnum[level]); // Error
 * ```
 */
export enum DiagnosticsLevelEnum {
  Ignored,
  Note,
  Remark,
  Warning,
  Error,
  Fatal,
}

/**
 * Diagnostics Message Level Configuration
 * @type {DiagnosticsLevelType}
 * @property {string} text Textual representation of the level
 * @property {chalk.Chalk} color Chalk color for the level
 *
 * @example
 * ```typescript
 * const level = DiagnosticsLevelConfiguration[DiagnosticsLevelEnum.Error];
 * console.log(level.text); // error
 * console.log(level.color("Hello")); // Hello in red
 * ```
 */
type DiagnosticsLevelType = {
  text: string;
  color: chalk.Chalk;
};

/**
 * Diagnostics Message Level Configuration
 * @type {DiagnosticsLevelType}
 * @property {string} text Textual representation of the level
 * @property {chalk.Chalk} color Chalk color for the level
 *
 * @example
 * ```typescript
 * const level = DiagnosticsLevelConfiguration[DiagnosticsLevelEnum.Error];
 * console.log(level.text); // error
 * console.log(level.color("Hello")); // Hello in red
 * ```
 */
const DiagnosticsLevelConfiguration: { [key in DiagnosticsLevelEnum]: DiagnosticsLevelType } = {
  [DiagnosticsLevelEnum.Ignored]: {
    text: "ignored",
    color: chalk.bold.gray,
  },
  [DiagnosticsLevelEnum.Note]: {
    text: "note",
    color: chalk.bold.blue,
  },
  [DiagnosticsLevelEnum.Remark]: {
    text: "remark",
    color: chalk.bold.blue,
  },
  [DiagnosticsLevelEnum.Warning]: {
    text: "warning",
    color: chalk.bold.yellow,
  },
  [DiagnosticsLevelEnum.Error]: {
    text: "error",
    color: chalk.bold.red,
  },
  [DiagnosticsLevelEnum.Fatal]: {
    text: "fatal",
    color: chalk.bold.red,
  },
};

/**
 * Diagnostics Context
 * @type {DiagnosticsContextType}
 * @property {number} linenumber Line number for the first line provided by `context`
 * @property {Array<string>} context Context lines
 *
 * @example
 * ```typescript
 * const context: DiagnosticsContextType = {
 *  linenumber: 1,
 *  context: ["Line 1", "Line 2", "Line 3"]
 * }
 * ```
 */
export type DiagnosticsContextType = {
  linenumber: number;
  lines: Array<string>;
};

/**
 * Diagnostics Message Type
 * @type {DiagnosticsMessageType}
 * @property {string} text Message text
 * @property {number} linenumber Line number
 * @property {number} column Column number
 *
 * @example
 * ```typescript
 * const message: DiagnosticsMessageType = {
 *   text: "Unknown property `foo`",
 *   linenumber: 3,
 *   column: 10
 * }
 * ```
 */
export type DiagnosticsMessageType = {
  text: string;
  linenumber?: number;
  column?: number;
};

/**
 * Diagnostics Message Interface
 * @interface IDiagnosticsMessage
 * @property {string} file File name
 * @property {DiagnosticsLevelEnum} level Message level
 * @property {DiagnosticsMessageType} message Message
 *
 * @example
 * ```typescript
 * const message: IDiagnosticsMessage = {
 *   file: "test.ts",
 *   level: DiagnosticsLevelEnum.Error,
 *   message: {
 *     text: "Unknown property `foo`",
 *     linenumber: 3,
 *     column: 10
 *   }
 * }
 * ```
 */
export interface IDiagnosticsMessage {
  file: string;
  level?: DiagnosticsLevelEnum;
  message: DiagnosticsMessageType;
}

/**
 * Diagnostics Message
 * @static createError Creates an error message
 * @static createWarning Creates a warning message
 * @function setFile Sets the file name
 * @function setLevel Sets the message level
 * @function setMessage Sets the message
 * @function setContext Sets the context
 * @function addFixitHint Adds a FixIt hint
 * @function toString Returns the message as a string
 *
 * @example Using the constructor
 * ```typescript
 * const message = new DiagnosticsMessage({
 *   file: "test.ts",
 *   level: DiagnosticsLevelEnum.Error,
 *   message: {
 *     text: "Unknown property `foo`",
 *     linenumber: 3,
 *     column: 10
 *   }
 * });
 * ```
 *
 * @example Using the static methods
 * ```typescript
 * const message = DiagnosticsMessage.createError("test.ts", {
 *   text: "Unknown property `foo`",
 *   linenumber: 3,
 *   column: 10
 * });
 * ```
 *
 * @example Creating a message with a context and FixIt Hints
 * ```typescript
 * const message = DiagnosticsMessage.createError("test.ts", {
 *  text: "Unknown property `foo`",
 *   linenumber: 3,
 *   column: 1
 * })
 *   .setContext(2, ["monkey: banana", "foo: foo", "elephant: trunk"])
 *   .addFixitHint(FixItHint.createInsertion(1, "bar"));
 * ```
 */
export class DiagnosticsMessage {
  file!: string;
  level!: DiagnosticsLevelEnum;
  message!: DiagnosticsMessageType;

  context?: DiagnosticsContextType;
  private fixitHints: Array<FixItHint> = new Array<FixItHint>();

  constructor(data: IDiagnosticsMessage) {
    this.setFile(data.file);
    this.setLevel(data.level ?? DiagnosticsLevelEnum.Note);
    this.setMessage(data.message);
  }

  /**
   * Creates a Diagnostics message with the level `Error`
   * @param file File path
   * @param message Error message
   * @returns Diagnostics Message
   */
  static createError(file: string, message: DiagnosticsMessageType): DiagnosticsMessage {
    return new DiagnosticsMessage({ file, level: DiagnosticsLevelEnum.Error, message });
  }

  /**
   * Creates a Diagnostics message with the level `Warning`
   * @param file File path
   * @param message Warning message
   * @returns Diagnostics Message
   */
  static createWarning(file: string, message: DiagnosticsMessageType): DiagnosticsMessage {
    return new DiagnosticsMessage({ file, level: DiagnosticsLevelEnum.Warning, message });
  }

  /**
   * Sets the path towards the file associated with the Diagnostics Message.
   *
   * Note: The file path cannot contain newlines or spaces.
   * @param file File path
   * @returns this
   */
  setFile(file: string): this {
    if (/\r?\n/.test(file)) throw new Error("File name cannot contain newlines.");
    if (file.includes(" ")) throw new Error("File name cannot contain spaces.");

    this.file = file;
    return this;
  }

  /**
   * Sets the level of the Diagnostics Message (i.e. `Error`, `Warning`, ...)
   * @param level Diagnostics Level
   * @returns this
   */
  setLevel(level: DiagnosticsLevelEnum): this {
    this.level = level;
    return this;
  }

  /**
   * Sets the message of the Diagnostics Message.
   *
   * Notes:
   * * The message cannot contain newlines.
   * * The column number must be greater than 0.
   * * The line number must be greater than 0.
   *
   * @param message Diagnostics Message
   * @returns this
   */
  setMessage(message: DiagnosticsMessageType): this {
    if (/\r?\n/.test(message.text)) throw new Error("Message cannot contain newlines.");
    if ((message.column ?? 1) <= 0) throw new RangeError("Column number must be greater than 0.");
    if ((message.linenumber ?? 1) <= 0) throw new RangeError("Line number must be greater than 0.");

    this.message = message;
    return this;
  }

  /**
   * Sets the context of the Diagnostics Message.
   *
   * Notes:
   * * The context can be provided as an array of strings or a single string.
   *   Any single string with newlines will be split into multiple lines.
   * * The starting line number must be greater than 0.
   * * The line number associated with the message must be within the range of the context.
   *
   * @param linenumber Line number for the first line provided by `context`
   * @param lines Context lines
   * @returns this
   */
  setContext(linenumber: number, lines: string | Array<string>): this {
    if ((this.message.linenumber ?? 1) < linenumber || (this.message.linenumber ?? 1) > linenumber + lines.length - 1) {
      throw new RangeError(
        "The line numbers provided by the context do not match the line number associated with the message."
      );
    }
    if (linenumber <= 0) throw new RangeError("Line number must be greater than 0.");
    const contextLines = Array.isArray(lines) ? lines : lines.split(/\r?\n/);
    this.context = { linenumber, lines: contextLines };
    return this;
  }

  /**
   * Adds a FixIt Hint to the Diagnostics Message.
   *
   * Notes:
   * * You must first provide a context before adding a FixIt Hint.
   * * The FixIt Hint cannot overlap with an existing FixIt Hint.
   *
   * @param hint FixIt Hint
   * @returns this
   *
   * @example Adding a FixIt Hint
   * ```typescript
   * const message = DiagnosticsMessage.createError("test.ts", {
   *   text: "Unknown property `foo`",
   *   linenumber: 3,
   *   column: 1
   * })
   *   .setContext(2, ["monkey: banana", "foo: foo", "elephant: trunk"])
   *   .addFixitHint(FixItHint.createInsertion(1, "bar"));
   * ```
   */
  addFixitHint(hint: FixItHint): this {
    if (this.context === undefined) throw new Error("Cannot add FixIt hint without a context.");

    // Check if the new hint does not overlap with the ranges in the current fixit hints
    if (
      this.fixitHints.some(
        fixit => fixit.range.index <= hint.range.index && hint.range.index <= fixit.range.index + fixit.range.length
      )
    ) {
      throw new Error("Cannot add FixIt hint that overlaps with an existing FixIt hint.");
    }

    // Add the new hint
    this.fixitHints.push(hint);

    // Sort the FixIt hints by index
    this.fixitHints = this.fixitHints.sort((a, b) => a.range.index - b.range.index);

    return this;
  }

  /**
   * Returns the FixIt Hints associated with the Diagnostics Message.
   * @returns Array of FixIt Hints
   */
  getFixitHints(): Array<FixItHint> {
    return this.fixitHints;
  }

  private getFixitHintsString(prefix: string): Array<string> {
    const elements = new Array<string>();
    if (this.message.column === undefined) return elements;

    let caretLine = "";
    let hintLine = "";

    // Determine the maximum width of the first line based on the FixIt Hints and the message
    const maxWidth =
      this.fixitHints.length > 0
        ? Math.max(
            this.fixitHints[this.fixitHints.length - 1].range.index +
              this.fixitHints[this.fixitHints.length - 1].range.length,
            this.message.text.length
          )
        : this.message.text.length;

    // Append each character (either caret or fixit-hint) line by line
    for (let i = 1; i <= maxWidth; i++) {
      const fixit = this.fixitHints.find(fixit => i >= fixit.range.index && i < fixit.range.index + fixit.range.length);
      const fixitHint = this.fixitHints.find(
        hint => i >= hint.range.index && i < hint.range.index + (hint.text?.length ?? 0)
      );
      const char =
        this.message.column === i && fixit?.modification !== "DEFAULT" ? "^" : fixit !== undefined ? "~" : " ";
      const color = fixit !== undefined ? ModificationColorCodes[fixit.modification] : chalk.bold.green;

      caretLine += char !== " " ? color(char) : char;
      if (fixitHint !== undefined && fixitHint.text !== undefined) {
        hintLine += fixitHint.text.charAt(i - fixitHint.range.index);
      } else {
        hintLine += " ";
      }
    }

    return hintLine.trimEnd().length === 0
      ? [prefix + caretLine.trimEnd()]
      : [prefix + caretLine.trimEnd(), prefix + hintLine.trimEnd()];
  }

  private getContextString(): Array<string> {
    const result: Array<string> = new Array<string>();
    if (this.context === undefined) {
      return result;
    }

    result.push("");

    const maxWidth = (this.context.linenumber + this.context.lines.length).toString().length;
    const seperator = " | ";

    for (let i = 0; i < this.context.lines.length; i++) {
      const isContextLine = this.context.linenumber + i === this.message.linenumber;
      const lineColor = isContextLine ? chalk.bold.whiteBright : chalk.bold.gray;
      const line = this.context.lines[i];
      const linenumber = (this.context.linenumber + i).toString().padStart(maxWidth, " ");

      result.push(lineColor(`${linenumber}${seperator}${line}`));

      if (this.context.linenumber + i === this.message.linenumber) {
        result.push(...this.getFixitHintsString(`${" ".repeat(maxWidth)}${seperator}`));
      }
    }
    return result;
  }

  /**
   * Generates an Expressive Diagnostics message in formatted output.
   * @returns Formatted message
   */
  toString(): string {
    const level = DiagnosticsLevelConfiguration[this.level];
    const message = [
      chalk.bold(`${this.file}:${this.message.linenumber ?? 1}:${this.message.column ?? 1}: `) +
        level.color(`${level.text}: `) +
        chalk.bold(this.message.text),
      ...this.getContextString(),
    ];

    return message.join("\n");
  }

  applyFixitHints(): string {
    if (this.context === undefined) {
      throw new Error("Cannot apply FixIt hints without a context.");
    }

    let result = this.context.lines[(this.message.linenumber ?? 1) - this.context.linenumber];

    this.fixitHints.forEach(fixit => {
      switch (fixit.modification) {
        case "INSERT":
          result = result.slice(0, fixit.range.index - 1) + fixit.text + result.slice(fixit.range.index - 1);
          break;
        case "REMOVE":
          result = result.slice(0, fixit.range.index - 1) + result.slice(fixit.range.index - 1 + fixit.range.length);
          break;
        case "REPLACE":
          result =
            result.slice(0, fixit.range.index - 1) +
            fixit.text +
            result.slice(fixit.range.index - 1 + fixit.range.length);
          break;
      }
    });

    return result;
  }
}
