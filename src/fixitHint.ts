/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import chalk from "chalk";

/**
 * Range in the string
 * @member index Index in the string
 * @member length Length of the range
 *
 * @example
 * ```typescript
 * const range = { index: 10, length: 5 };
 * ```
 */
export type RangeType = { index: number; length: number };

/**
 * Modification type associate with this fix-it hint
 * @member DEFAULT No modification
 * @member INSERT Insertion
 * @member REMOVE Removal
 * @member REPLACE Replacement
 *
 * @example
 * ```typescript
 * const modification: ModificationType = "INSERT";
 * ```
 */
export type ModificationType = "DEFAULT" | "INSERT" | "REMOVE" | "REPLACE";

/**
 * Color codes for the modification types
 * @member DEFAULT Red
 * @member INSERT Green
 * @member REMOVE Red
 * @member REPLACE Yellow
 */
export const ModificationColorCodes = {
  DEFAULT: chalk.red,
  INSERT: chalk.green,
  REMOVE: chalk.red,
  REPLACE: chalk.yellow,
};

/**
 * Fix-it Hint
 *
 * @class FixItHint
 * @member modification Modification type (DEFAULT, INSERT, REMOVE, REPLACE)
 * @member range Range in the string
 * @member text Text to insert, replace or remove
 *
 * @example Inserting character(s)
 * ```typescript
 * const hint = FixItHint.createInsertion(10, "Hello");
 * ```
 *
 * @example Replacing character(s) with the provided hint
 * ```typescript
 * const hint = FixItHint.createReplacement({ index: 10, length: 5 }, "Hello");
 * ```
 *
 * @example Removing character(s)
 * ```typescript
 * const hint = FixItHint.createRemoval({ index: 10, length: 5 });
 * ```
 */
export class FixItHint {
  modification: ModificationType;
  range: RangeType;
  text?: string;

  /**
   * @param modification Modification type (DEFAULT, INSERT, REMOVE, REPLACE)
   * @param range Range in the string
   * @private
   */
  constructor(modification: ModificationType, range: RangeType, text?: string) {
    this.modification = modification;
    this.range = range;
    if (modification === "INSERT" || modification === "REPLACE") {
      if (text === undefined) throw new Error("Text is required for INSERT and REPLACE modifications");
      if (modification === "INSERT" && range.length > 1) throw new Error("Length must be 1 for INSERT modifications");
      this.text = text;
    } else if (modification === "REMOVE" || modification === "DEFAULT") {
      if (text !== undefined) throw new Error("Text is not supported for REMOVE modifications");
    }
  }

  /**
   * Creates a FixIt Hint without any modification type
   * @param range Range in the string
   * @returns Fix-it Hint Object
   */
  static create(range: RangeType): FixItHint {
    return new FixItHint("DEFAULT", range);
  }

  /**
   * Creates a modification hint for inserting character(s) at a specific index
   * @param index Index for the insertion
   * @param text Text to insert
   * @returns Fix-it Hint Object
   */
  static createInsertion(index: number, text: string): FixItHint {
    return new FixItHint("INSERT", { index, length: 1 }, text);
  }

  /**
   * Creates a modification hint for replacing character(s) at a specific index
   * @param range Range to replace
   * @param text Text to replace with
   * @returns Fix-it Hint Object
   */
  static createReplacement(range: RangeType, text: string): FixItHint {
    return new FixItHint("REPLACE", range, text);
  }

  /**
   * Creates a modification hint for removing character(s) at a specific index
   * @param range Range to remove
   * @returns Fix-it Hint Object
   */
  static createRemoval(range: RangeType): FixItHint {
    return new FixItHint("REMOVE", range);
  }
}
