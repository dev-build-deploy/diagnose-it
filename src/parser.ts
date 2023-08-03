/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import readline from "readline";
import fs from "fs";
import { ExpressiveMessage, ExpressiveType } from "./diagnostics";
import * as sarif from "@dev-build-deploy/sarif-it";

const LLVM_EXPRESSIVE_DIAGNOSTICS_REGEX = new RegExp(
  "(?<file>[\\w,\\s-.]+):(?<lineNumber>[0-9]+):(?<columnNumber>[0-9]+): (?<messageType>(error|warning|note)): (?<message>(.*))"
);

/**
 * Extracts Expressive Diagnostic messages from SARIF.
 *
 * NOTE: currently we only support:
 *   - plain text files
 *   - the results of the last run
 *
 * @param sarif The SARIF to extract messages from.
 * @param run Index of run, defaults to the last run.
 *
 * @returns Async Generator of Expressive Messages.
 */
export function* extractFromSarif(sarif: sarif.Log, run: number | undefined = undefined) {
  const sarifObj = sarif.properties();

  if (run === undefined) {
    run = sarifObj.runs.length - 1;
  }

  const results = sarifObj.runs[run].results ?? [];
  for (const result of results) {
    for (const location of result.locations ?? []) {
      if (result.message.text === undefined || location.physicalLocation === undefined) {
        continue;
      }

      const msg = new ExpressiveMessage({
        id: location.physicalLocation.artifactLocation?.uri ?? "",
        message: result.message.text,
        type: (result.level ?? "warning") as ExpressiveType,
      });

      if (location.physicalLocation.region) {
        const region = location.physicalLocation.region;
        const line = region.startLine ?? 1;
        const column = region.startColumn ?? 1;
        const length = region.endColumn && column ? region.endColumn - column : 1;
        const snippet = region.snippet?.text;

        msg.lineNumber(line).caret(column ?? 1, length ?? 1);

        if (snippet !== undefined) {
          msg.context(snippet, line);
        }
      }

      yield msg;
    }
  }
}

/**
 * Extracts Expressive Diagnostic messages from a raw file.
 * This can be used to extract messages from compiler output
 *
 * @param filePath Path to file to extract messages from.
 */
async function* extractRaw(filePath: string) {
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
      matchIndex = line.length - line.trimStart().length;
    } else if (currentMessage) {
      const lineNumber = currentMessage.toJSON().lineNumber;
      if (lineNumber !== undefined) {
        currentMessage = currentMessage.context(line.substring(matchIndex), lineNumber);
      }
      yield currentMessage;
      currentMessage = undefined;
    }
  }

  if (currentMessage) {
    yield currentMessage;
  }
}

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
  if (filePath.endsWith(".sarif") || filePath.endsWith(".json.sarif")) {
    const sarifData = sarif.Log.fromFile(filePath);

    for (const message of extractFromSarif(sarifData)) {
      yield message;
    }
    return;
  }

  for await (const message of extractRaw(filePath)) {
    yield message;
  }
}
