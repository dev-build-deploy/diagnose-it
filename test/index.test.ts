/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { DiagnosticsLevelEnum, DiagnosticsMessage, FixItHint, extractFromFile } from "../src/index.js";
import * as fs from "fs";

// eslint-disable-next-line no-control-regex
const unchalk = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, "");

describe("Diagnostics Message", () => {
  test("Minimal usage", () => {
    expect(unchalk(DiagnosticsMessage.createError("example", { text: "Subject" }).toString())).toBe(
      "example:1:1: error: Subject"
    );
    expect(
      unchalk(
        new DiagnosticsMessage({
          file: "example",
          level: DiagnosticsLevelEnum.Error,
          message: { text: "Subject" },
        }).toString()
      )
    ).toBe("example:1:1: error: Subject");
  });
});

describe("FixIt Hint", () => {
  test("Minimal usage", () => {
    expect(() => {
      new FixItHint("INSERT", { index: 1, length: 1 }, "insertion");
    }).not.toThrow();
  });
});

describe("Parse from file", () => {
  test("Parse from file", async () => {
    for (const entry of fs.readdirSync("test/fixtures")) {
      if (fs.statSync(`test/fixtures/${entry}`).isDirectory() || entry.endsWith(".fixture")) continue;

      const fixture = JSON.parse(fs.readFileSync(`test/fixtures/${entry}.fixture`, "utf8"));
      const file = `test/fixtures/${entry}`;

      let index = 0;
      for await (const message of extractFromFile(file)) {
        expect(JSON.parse(JSON.stringify(message, null, 2))).toStrictEqual(fixture[index]);
        index++;
        console.log(message.toString());
      }
    }
  });
});

describe("Parse from SARIF file", () => {
  test("Parse from SARIF file", async () => {
    for (const entry of fs.readdirSync("test/sarif")) {
      if (fs.statSync(`test/sarif/${entry}`).isDirectory() || entry.endsWith(".fixture")) continue;

      const fixture = JSON.parse(fs.readFileSync(`test/sarif/${entry}.fixture`, "utf8"));
      const file = `test/sarif/${entry}`;

      let index = 0;
      for await (const message of extractFromFile(file)) {
        expect(JSON.parse(JSON.stringify(message, null, 2))).toStrictEqual(fixture[index]);
        index++;
        console.log(message.toString());
      }
    }
  });
});
