/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import readline from "readline";
import fs from "fs";
import { DiagnosticsLevelEnum, DiagnosticsMessage } from "./diagnosticsMessage.js";
import * as sarif from "@dev-build-deploy/sarif-it";

const LLVM_EXPRESSIVE_DIAGNOSTICS_REGEX = new RegExp(
  "(?:\\s*)(?<file>[\\w,-.]+):(?<lineNumber>[0-9]+):(?<columnNumber>[0-9]+): (?<messageType>(error|warning|note)): (?<message>(.*))"
);

function getDiagnosticsLevelFromString(value: string): DiagnosticsLevelEnum {
  if (value === "error") return DiagnosticsLevelEnum.Error;
  if (value === "warning") return DiagnosticsLevelEnum.Warning;

  return DiagnosticsLevelEnum.Note;
}

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

      const region = location.physicalLocation.region;
      const line = region?.startLine ?? 1;
      const column = region?.startColumn ?? 1;
      const snippet = region?.snippet?.text;

      const msg = new DiagnosticsMessage({
        file: location.physicalLocation.artifactLocation?.uri ?? "",
        message: {
          text: result.message.text,
          linenumber: line,
          column,
        },
        level: getDiagnosticsLevelFromString(result.level ?? "warning"),
      });
      if (snippet !== undefined) {
        msg.setContext(line, snippet);
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
  let currentMessage: DiagnosticsMessage | undefined = undefined;
  let matchIndex = 0;

  const lineReader = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of lineReader) {
    const match = LLVM_EXPRESSIVE_DIAGNOSTICS_REGEX.exec(line);
    if (match && match.groups) {
      currentMessage = new DiagnosticsMessage({
        file: match.groups.file,
        message: {
          text: match.groups.message,
          linenumber: parseInt(match.groups.lineNumber),
          column: parseInt(match.groups.columnNumber),
        },
        level: getDiagnosticsLevelFromString(match.groups.messageType),
      });
      matchIndex = line.length - line.trimStart().length;
    } else if (currentMessage) {
      const lineNumber = currentMessage.message.linenumber;
      if (lineNumber !== undefined) {
        currentMessage = currentMessage.setContext(lineNumber, line.substring(matchIndex));
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
