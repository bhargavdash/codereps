/**
 * Source for public/runners/react-runtime.js — the self-hosted globals the
 * react_iframe runner loads inside its sandboxed iframe (architecture §6).
 * React 19 dropped UMD builds, so this IIFE bundle is the modern equivalent
 * of "self-hosted React UMD": one React version everywhere, no CDN.
 *
 * Built by scripts/build-runner-assets.mjs (predev/prebuild).
 */

import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import * as TestingLibraryDom from "@testing-library/dom";

declare global {
  interface Window {
    React: typeof React;
    ReactDOM: typeof ReactDOMClient;
    TestingLibraryDom: typeof TestingLibraryDom;
  }
}

window.React = React;
window.ReactDOM = ReactDOMClient;
window.TestingLibraryDom = TestingLibraryDom;
