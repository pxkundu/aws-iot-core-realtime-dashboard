/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import type { AuthUser } from "aws-amplify/auth";

/**
 * Authentication manager following Amplify Gen 2 patterns
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth/connect-your-frontend/
 */
const useAuthManager = () => {
	const [user, setUser] = useState<AuthUser | undefined>();
	const [isUserSignedIn, setIsUserSignedIn] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const checkAuthState = useCallback(async () => {
		try {
			setIsLoading(true);
			const currentUser = await getCurrentUser();
			setUser(currentUser);
			setIsUserSignedIn(true);
			console.log("✅ User is authenticated:", currentUser.username);
		} catch (error) {
			// User is not authenticated - this is normal
			setUser(undefined);
			setIsUserSignedIn(false);
			console.log("ℹ️ User not authenticated");
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleSignOut = useCallback(async () => {
		try {
			await signOut();
			setUser(undefined);
			setIsUserSignedIn(false);
			console.log("✅ User signed out successfully");
		} catch (error) {
			console.error("❌ Sign out error:", error);
		}
	}, []);

	useEffect(() => {
		checkAuthState();

		// Listen to auth events
		const unsubscribe = Hub.listen("auth", ({ payload }) => {
			switch (payload.event) {
				case "signedIn":
					console.log("🔑 Auth: User signed in");
					checkAuthState();
					break;
				case "signedOut":
					console.log("🔑 Auth: User signed out");
					setUser(undefined);
					setIsUserSignedIn(false);
					setIsLoading(false);
					break;
				case "tokenRefresh":
					console.log("🔄 Auth: Token refreshed");
					break;
				case "tokenRefresh_failure":
					console.log("❌ Auth: Token refresh failed");
					break;
				default:
					break;
			}
		});

		return unsubscribe;
	}, [checkAuthState]);

	const methods = useMemo(
		() => ({
			checkAuthState,
			signOut: handleSignOut
		}),
		[checkAuthState, handleSignOut]
	);

	return useMemo(
		() => ({
			user,
			isUserSignedIn,
			isLoading,
			...methods
		}),
		[user, isUserSignedIn, isLoading, methods]
	);
};

export default useAuthManager;
