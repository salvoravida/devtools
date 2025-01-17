import { Action, Store, ThunkAction, AnyAction } from "@reduxjs/toolkit";

import type { AppStore } from "ui/setup/store";

import * as appActions from "./app";
import * as timelineActions from "./timeline";
import * as sessionActions from "./session";
import * as commentsActions from "./comments";
import * as layoutActions from "./layout";
import * as reactDevToolsActions from "./reactDevTools";
import { ThunkExtraArgs } from "ui/utils/thunk";
import { UIState } from "ui/state";
import { ReactDevToolsAction } from "./reactDevTools";
import * as eventListeners from "devtools/client/debugger/src/actions/event-listeners";
import debuggerActions from "devtools/client/debugger/src/actions";
import UserProperties from "devtools/client/inspector/rules/models/user-properties";
import * as consoleActions from "devtools/client/webconsole/actions";
import { QuickOpenActions } from "devtools/client/debugger/src/actions/quick-open";
import { NetworkAction } from "./network";
import { LayoutAction } from "./layout";

export type UIAction = LayoutAction | NetworkAction | ReactDevToolsAction | QuickOpenActions;

export type UIThunkAction<TReturn = void> = ThunkAction<
  TReturn,
  UIState,
  ThunkExtraArgs,
  AnyAction
>;

export type UIStore = AppStore;

const { initialAppState, ...actualAppActions } = appActions;

export const actions = {
  ...actualAppActions,
  ...commentsActions,
  ...consoleActions,
  ...debuggerActions,
  ...eventListeners,
  ...layoutActions,
  ...reactDevToolsActions,
  ...sessionActions,
  ...timelineActions,
};
