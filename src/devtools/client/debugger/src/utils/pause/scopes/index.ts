/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import type { ConvertedScope, PauseFrame } from "devtools/client/debugger/src/reducers/pause";
import { ContainerItem } from "devtools/packages/devtools-reps";
import { getScope, mergeScopes } from "./getScope";

export function getScopes(
  why: string | null,
  selectedFrame: PauseFrame | null,
  frameScopes?: ConvertedScope | null
) {
  if (!selectedFrame) {
    return null;
  }

  if (!frameScopes) {
    return null;
  }

  const scopes = [];

  let scope: ConvertedScope | null = frameScopes;
  let scopeIndex = 1;
  let prev = null,
    prevItem = null;

  while (scope) {
    let scopeItem = getScope(scope, selectedFrame, frameScopes, why, scopeIndex);

    if (scopeItem) {
      const mergedItem: ContainerItem | undefined | null =
        !!prev && !!prevItem ? mergeScopes(prev, scope, prevItem, scopeItem) : null;
      if (mergedItem) {
        scopeItem = mergedItem;
        scopes.pop();
      }
      scopes.push(scopeItem);
    }
    prev = scope;
    prevItem = scopeItem;
    scopeIndex++;
    scope = scope.parent;
  }

  return scopes;
}
