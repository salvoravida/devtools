/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { bindActionCreators, Dictionary } from "@reduxjs/toolkit";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import type { AppDispatch } from "ui/setup/store";

import { copyToTheClipboard } from "../../../utils/clipboard";
import actions from "../../../actions";
import { getRawSourceURL } from "../../../utils/source";
import { getSourcemapVisualizerURL } from "../../../utils/sourceVisualizations";
import type { SourceDetails } from "ui/reducers/sources";

type EditorActions = ReturnType<typeof editorItemActions>;

// menu items

const copySourceUri2Item = (selectedSource: SourceDetails) => ({
  id: "node-menu-copy-source-url",
  label: "Copy source URI",
  accesskey: "u",
  disabled: !selectedSource.url,
  click: () => copyToTheClipboard(getRawSourceURL(selectedSource.url)),
});

const showSourceMenuItem = (
  cx: Context,
  selectedSource: SourceDetails,
  editorActions: EditorActions
) => ({
  id: "node-menu-show-source",
  label: "Reveal in tree",
  accesskey: "r",
  disabled: !selectedSource.url,
  click: () => editorActions.showSource(cx, selectedSource.id),
});

const sourceMapItem = (
  cx: Context,
  selectedSource: SourceDetails,
  alternateSource: SourceDetails | null,
  sourcesById: Dictionary<SourceDetails>
) => ({
  id: "node-menu-source-map",
  label: "Visualize source map",
  accesskey: "B",
  disabled: !getSourcemapVisualizerURL(selectedSource, alternateSource, sourcesById),
  click: () => {
    const href = getSourcemapVisualizerURL(selectedSource, alternateSource, sourcesById);
    if (href) {
      window.open(href, "_blank");
    }
  },
});

export function editorMenuItems({
  cx,
  editorActions,
  selectedSource,
  alternateSource,
  sourcesById,
}: {
  cx: Context;
  editorActions: EditorActions;
  selectedSource: SourceDetails;
  alternateSource: SourceDetails | null;
  sourcesById: Dictionary<SourceDetails>;
}) {
  const items = [];

  items.push(
    copySourceUri2Item(selectedSource),
    { type: "separator" },
    showSourceMenuItem(cx, selectedSource, editorActions),
    sourceMapItem(cx, selectedSource, alternateSource, sourcesById)
  );

  return items;
}

export function editorItemActions(dispatch: AppDispatch) {
  return bindActionCreators(
    {
      flashLineRange: actions.flashLineRange,
      showSource: actions.showSource,
    },
    dispatch
  );
}
