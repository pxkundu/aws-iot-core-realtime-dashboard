/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./amplify-config"; // This will configure Amplify synchronously

import "./locales/i18n";

// Render the app directly since Amplify is configured synchronously
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);
