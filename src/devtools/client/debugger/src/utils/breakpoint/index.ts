/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { Location } from "@replayio/protocol";
import sortBy from "lodash/sortBy";
import type { UIState } from "ui/state";

import { getSourceDetails } from "ui/reducers/sources";
import type {
  Breakpoint,
  PendingBreakpoint,
  SourceLocation,
  PendingLocation,
} from "../../reducers/types";
import assert from "../assert";
import { features } from "../prefs";

export * from "./astBreakpointLocation";
export * from "./breakpointPositions";

// Return the first argument that is a string, or null if nothing is a
// string.
export function firstString(...args: any[]) {
  for (const arg of args) {
    if (typeof arg === "string") {
      return arg;
    }
  }
  return null;
}

// The ID for a Breakpoint is derived from its location in its Source.
export function getLocationKey(location: SourceLocation & { scriptId?: string }) {
  const { sourceId, line, column } = location;
  const columnString = column || "";
  return `${sourceId || location.scriptId}:${line}:${columnString}`;
}

export function getLocationAndConditionKey(location: SourceLocation, condition: string) {
  return `${getLocationKey(location)}:${condition}`;
}

export function isMatchingLocation(location1?: SourceLocation, location2?: SourceLocation) {
  return location1 && location2 && getLocationKey(location1) === getLocationKey(location2);
}

export function getLocationWithoutColumn(location: Location) {
  const { sourceId, line } = location;
  return `${sourceId}:${line}`;
}

export function makePendingLocationId(
  location: Location & { sourceUrl: string },
  recordingId: string
) {
  assertPendingLocation(location);
  const { sourceUrl, line, column } = location;
  const sourceUrlString = sourceUrl || "";
  const columnString = column || "";

  return `${recordingId}:${sourceUrlString}:${line}:${columnString}`;
}

export function makeBreakpointLocation(state: UIState, location: SourceLocation): SourceLocation {
  const source = getSourceDetails(state, location.sourceId);
  if (!source) {
    throw new Error("no source");
  }

  let sourceUrl;
  let sourceId = source.id;

  if (source.url) {
    sourceUrl = source.url;
  }

  return {
    line: location.line,
    column: location.column,
    sourceUrl,
    sourceId: sourceId!,
  };
}

export function assertPendingBreakpoint(pendingBreakpoint: PendingBreakpoint) {
  assertPendingLocation(pendingBreakpoint.location);
}

export function assertPendingLocation(location: PendingLocation) {
  assert(!!location, "location must exist");

  const { sourceUrl } = location;

  // sourceUrl is null when the source does not have a url
  assert(sourceUrl !== undefined, "location must have a source url");
  assert(location.hasOwnProperty("line"), "location must have a line");
  assert(location.hasOwnProperty("column") != null, "location must have a column");
}

// syncing
export function breakpointAtLocation(breakpoints: Breakpoint[], { line, column }: Location) {
  return breakpoints.find(breakpoint => {
    const sameLine = breakpoint.location.line === line;
    if (!sameLine) {
      return false;
    }

    // NOTE: when column breakpoints are disabled we want to find
    // the first breakpoint
    if (!features.columnBreakpoints) {
      return true;
    }

    return breakpoint.location.column === column;
  });
}

export function createPendingBreakpoint(bp: Breakpoint, sourceUrl: string): PendingBreakpoint {
  const location = { ...bp.location, sourceUrl };
  assertPendingLocation(location);

  return {
    options: bp.options,
    disabled: bp.disabled,
    location,
    astLocation: bp.astLocation!,
  };
}

export function getSelectedText(breakpoint: Breakpoint) {
  return breakpoint.text;
}

export function sortSelectedBreakpoints(breakpoints: Breakpoint[]) {
  return sortBy(breakpoints, [
    // Priority: line number, undefined column, column number
    breakpoint => breakpoint.location.line,
    breakpoint => {
      return breakpoint.location.column === undefined || breakpoint.location.column;
    },
  ]);
}

export const isBreakable = (bp?: Breakpoint) => !!bp?.options.shouldPause;
export const isLogpoint = (bp?: Breakpoint) => !!bp?.options.logValue;
