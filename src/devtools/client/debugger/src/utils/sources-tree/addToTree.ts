/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { isInvalidUrl } from "../source";

import {
  nodeHasChildren,
  isPathDirectory,
  partIsFile,
  createSourceNode,
  createDirectoryNode,
} from "./utils";
import { createTreeNodeMatcher, findNodeInContents } from "./treeOrder";
import { getURL } from "./getURL";

// import type { Source } from "../../reducers/sources";
import type { TreeNode, TreeSource, TreeDirectory, ParentMap } from "./types";
import type { ParsedUrl } from "./getURL";
import { SourceDetails } from "ui/reducers/sources";

function createNodeInTree(part: string, path: string, tree: TreeDirectory, index: number) {
  const node = createDirectoryNode(part, path, []);

  // we are modifying the tree
  const contents = tree.contents.slice(0);
  contents.splice(index, 0, node);
  tree.contents = contents;

  return node;
}

/*
 * Look for the child node
 * 1. if it exists return it
 * 2. if it does not exist create it
 */
function findOrCreateNode(
  parts: string[],
  subTree: TreeDirectory,
  path: string,
  part: string,
  index: number,
  url: TreeNode,
  debuggeeHost: string,
  source: SourceDetails
) {
  const addedPartIsFile = partIsFile(index, parts, url);

  const { found: childFound, index: childIndex } = findNodeInContents(
    subTree,
    createTreeNodeMatcher(part, !addedPartIsFile, debuggeeHost)
  );

  // we create and enter the new node
  if (!childFound) {
    return createNodeInTree(part, path, subTree, childIndex);
  }

  // we found a path with the same name as the part. We need to determine
  // if this is the correct child, or if we have a naming conflict
  const child = subTree.contents[childIndex];
  const childIsFile = !nodeHasChildren(child);

  // if we have a naming conflict, we'll create a new node
  if (childIsFile != addedPartIsFile) {
    // pass true to findNodeInContents to sort node by url
    const { index: insertIndex } = findNodeInContents(
      subTree,
      createTreeNodeMatcher(part, !addedPartIsFile, debuggeeHost, source, true)
    );
    return createNodeInTree(part, path, subTree, insertIndex);
  }

  // if there is no naming conflict, we can traverse into the child
  return child;
}

/*
 * walk the source tree to the final node for a given url,
 * adding new nodes along the way
 */
function traverseTree(
  url: ParsedUrl,
  tree: TreeDirectory,
  debuggeeHost: string,
  source: SourceDetails
) {
  const parts = url.path.replace(/\/$/, "").split("/");
  parts[0] = url.group;

  let path = "";
  return parts.reduce((subTree, part, index) => {
    path = `${path}/${part}`;

    const debuggeeHostIfRoot = index === 1 ? debuggeeHost : null;

    return findOrCreateNode(
      parts,
      subTree,
      path,
      part,
      index,
      // @ts-expect-error Problem with `url` vs `TreeNode` here and in other fns?
      url,
      debuggeeHostIfRoot,
      source
    ) as TreeDirectory;
  }, tree);
}

/*
 * Add a source file to a directory node in the tree
 */
function addSourceToNode(node: TreeDirectory, url: ParsedUrl, source: SourceDetails) {
  const isFile = !isPathDirectory(url.path);

  // @ts-expect-error intentional error check apparently
  if (node.type == "source" && !isFile) {
    throw new Error(`Unexpected type "source" at: ${node.name}`);
  }

  // if we have a file, and the subtree has no elements, overwrite the
  // subtree contents with the source
  if (isFile) {
    // @ts-expect-error this is intentional
    node.type = "source";
    // This is old and weird, but the `return source` was here already
    return source;
  }

  const { filename } = url;
  const { found: childFound, index: childIndex } = findNodeInContents(
    node,
    createTreeNodeMatcher(filename, false, undefined)
  );

  // if we are readding an existing file in the node, overwrite the existing
  // file and return the node's contents
  if (childFound) {
    const existingNode = node.contents[childIndex];
    if (existingNode.type === "source") {
      existingNode.contents = source;
    }

    return node.contents;
  }

  // if this is a new file, add the new file;
  const newNode = createSourceNode(filename, source.url!, source);
  const contents = node.contents.slice(0);
  contents.splice(childIndex, 0, newNode);
  return contents;
}

/**
 * @memberof utils/sources-tree
 * @static
 */
export function addToTree(tree: TreeDirectory, source: SourceDetails, debuggeeHost?: string) {
  const url = getURL(source, debuggeeHost);

  if (isInvalidUrl(url, source)) {
    return;
  }

  const finalNode = traverseTree(url, tree, debuggeeHost!, source);

  // TODO This does weird mutations and changing of node types, rework this
  // @ts-expect-error intentional
  finalNode.contents = addSourceToNode(finalNode, url, source);
}
