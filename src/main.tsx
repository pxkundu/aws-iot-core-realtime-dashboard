/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import ReactDOM from "react-dom/client";

import App from "./App";
import { configureAmplify } from "./amplify-config";

import "./locales/i18n";

// Configure Amplify with Cognito authentication
configureAmplify();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);
