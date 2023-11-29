/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import fs from "fs";
import * as diff from "diff";
import { DiagnosticsMessage } from "./diagnosticsMessage";

/**
 * Creates a patch based on an unified Diff.
 *
 * NOTE: This is not a full implementation of the unified Diff format,
 *       but only supports the bare minimum required to create a patch
 *       that applies Fix-It Hints, covering a single line in a single
 *       hunk.
 * @returns Patch.
 */
export function createPatch(message: DiagnosticsMessage): string {
  if (message.context === undefined) {
    throw new Error("Cannot apply FixIt hints without a context.");
  }

  // get modification date of file as Date object
  const stats = fs.existsSync(message.file) ? fs.statSync(message.file) : undefined;
  const mtime = stats ? new Date(stats.mtimeMs) : new Date();

  const original = message.context?.lines[(message.message.linenumber ?? 1) - message.context.linenumber];

  // apply fixit hints to original string
  let expected = original;

  // each fixit hint modifies the string, so we need to keep track of the offset
  let offset = 0;

  // Use a copy of the array to prevent modifying the original
  const fixitHints = [...message.getFixitHints()];

  fixitHints.forEach(fixit => {
    fixit.range.index += offset;
    expected = fixit.apply(expected);

    // update offset based on modification type
    switch (fixit.modification) {
      case "INSERT":
        offset += fixit.text?.length ?? 0;
        break;
      case "REMOVE":
        offset -= fixit.range.length;
        break;
      case "REPLACE":
        offset += (fixit.text?.length ?? fixit.range.length) - fixit.range.length;
        break;
    }
  });

  const linenumber = message.context.linenumber;
  const linecount = message.context.lines.length;

  let result = `--- ${message.file} ${mtime.toLocaleString("en-GB")}
+++ ${message.file}.fix ${new Date().toLocaleString("en-GB")}
@@ -${linenumber},${linecount} +${linenumber},${linecount} @@`;

  for (const line of message.context?.lines ?? []) {
    const modification = line === original && original !== expected;
    result += `\n${modification ? "-" : " "}${line}`;
    if (modification) {
      result += `\n+${expected}`;
    }
  }

  return result;
}

/**
 * Applies a patch (see createPatch) to a file using a Buffer.
 * @param patch
 * @internal
 */
export function applyPatch(patch: string): string {
  const filename = patch.split(/\r?\n/)[0].split(" ")[1];
  const source = fs.readFileSync(filename, "utf-8");
  const res = diff.applyPatch(source, patch);
  if (res === false) {
    throw new Error("Failed to apply patch");
  }

  return res;
}
