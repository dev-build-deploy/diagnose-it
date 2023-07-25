/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import readline from "readline";
import fs from "fs";
import { ExpressiveMessage, ExpressiveType } from "./diagnostics";

const LLVM_EXPRESSIVE_DIAGNOSTICS_REGEX = new RegExp(
  "(?<file>[\\w,\\s-.]+):(?<lineNumber>[0-9]+):(?<columnNumber>[0-9]+): (?<messageType>(error|warning|note)): (?<message>(.*))"
);

/**
 * Extracts Expressive Diagnostic messages from a file.
 * This can be used to extract messages from compile output
 *
 * @param filePath Path to file to extract messages from.
 * @returns Async Generator of Expressive Messages.
 *
 * @see https://clang.llvm.org/diagnostics.html
 */
export async function* extractFromFile(filePath: string) {
  let currentMessage: ExpressiveMessage | undefined = undefined;
  let matchIndex = 0;

  const lineReader = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of lineReader) {
    const match = LLVM_EXPRESSIVE_DIAGNOSTICS_REGEX.exec(line);
    if (match && match.groups) {
      currentMessage = new ExpressiveMessage({
        id: match.groups.file,
        message: match.groups.message,
        type: match.groups.messageType as ExpressiveType,
        lineNumber: parseInt(match.groups.lineNumber),
        caret: { index: parseInt(match.groups.columnNumber), length: 1 },
      });
      matchIndex = match.index;
    } else if (currentMessage) {
      const lineNumber = currentMessage.toJSON().lineNumber;
      if (lineNumber !== undefined) {
        currentMessage = currentMessage.context(line.substring(matchIndex + 1), lineNumber);
      }

      yield currentMessage;
      currentMessage = undefined;
    }
  }

  if (currentMessage) {
    yield currentMessage;
  }
}
