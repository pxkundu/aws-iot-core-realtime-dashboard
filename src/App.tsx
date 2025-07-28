/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { StrictMode, Suspense, useEffect } from "react";

import { Loader } from "@aws-amplify/ui-react";
import { AppWrapper } from "@demo/core/AppWrapper";
import { AuthProvider } from "@demo/core/AuthProvider";
import { RouteChunks } from "@demo/core/Routes";
import { ToastContainer } from "@demo/core/Toast";
import { appConfig } from "@demo/core/constants";
import { initializeSecurity } from "@demo/utils/securityValidation";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

// Import Amplify configuration
import "./amplify-config";

const {
	PERSIST_STORAGE_KEYS: { LOCAL_APP_VERSION },
	ENV: { APP_VERSION }
} = appConfig;

const StaticLoader = () => (
	<Loader width="40px" height="40px" position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" />
);

const router = createBrowserRouter(RouteChunks);

const App = () => {
	const localAppVersion = localStorage.getItem(LOCAL_APP_VERSION) || "";

	// Initialize security monitoring (non-breaking)
	useEffect(() => {
		initializeSecurity();
	}, []);

	if (localAppVersion === APP_VERSION) {
		return (
			<StrictMode>
				<Suspense fallback={<StaticLoader />}>
					<AuthProvider>
						<AppWrapper>
							<ToastContainer />
							<RouterProvider fallbackElement={<StaticLoader />} router={router} />
						</AppWrapper>
					</AuthProvider>
				</Suspense>
			</StrictMode>
		);
	} else {
		localStorage.clear();
		localStorage.setItem(LOCAL_APP_VERSION, APP_VERSION);
		window.location.reload();

		return <StaticLoader />;
	}
};

export default App;
