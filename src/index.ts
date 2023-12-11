/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

export { DiagnosticsLevelEnum, DiagnosticsMessage } from "./diagnosticsMessage.js";

export { FixItHint } from "./fixitHint.js";
export { extractFromFile, extractFromSarif } from "./parser.js";
export { createPatch } from "./diff.js";

// Types
export type { DiagnosticsContextType, DiagnosticsMessageType, IDiagnosticsMessage } from "./diagnosticsMessage.js";

export type { ModificationType, RangeType } from "./fixitHint.js";
