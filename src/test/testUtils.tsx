import * as rtl from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import React, { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import type { PreloadedState } from "@reduxjs/toolkit";
import type { UIState } from "ui/state";
import type { UIStore } from "ui/actions";

import { bootstrapStore, extendStore } from "ui/setup/store";
import setupDevtools from "ui/setup/dynamic/devtools";
// import type { AppStore, RootState } from "../store";

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store. For
// future dependencies, such as wanting to test with react-router, you can extend
// this interface to accept a path and route and use those in a <MemoryRouter />
interface ExtendedRenderOptions extends Omit<RenderOptions, "queries"> {
  preloadedState?: Partial<UIState>;
  store?: UIStore;
}

export async function createTestStore(preloadedState: Partial<UIState> = {}) {
  const store = bootstrapStore(preloadedState);
  await setupDevtools(store);

  return store;
}

async function render(
  ui: React.ReactElement,
  { preloadedState = {}, store, ...renderOptions }: ExtendedRenderOptions = {}
) {
  if (!store) {
    // Can't await as a param initializer
    store = await createTestStore(preloadedState);
  }
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return <Provider store={store!}>{children}</Provider>;
  }
  return { store, ...rtl.render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// re-export everything
export * from "@testing-library/react";
// override render method
export { render };