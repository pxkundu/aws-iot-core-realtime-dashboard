/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { FC, ReactNode } from "react";
import { View, Loader, Text } from "@aws-amplify/ui-react";

import { useAuthContext } from "@demo/core/AuthProvider";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

/**
 * Auth guard following Amplify Gen 2 patterns
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth/connect-your-frontend/
 */
const AuthGuard: FC<Props> = ({ children, fallback }) => {
	const { isUserSignedIn, isLoading } = useAuthContext();

	// Show loading while checking authentication
	if (isLoading) {
		return (
			<View 
				style={{ 
					display: 'flex', 
					justifyContent: 'center', 
					alignItems: 'center', 
					height: '100vh',
					flexDirection: 'column',
					gap: '1rem'
				}}
			>
				<Loader size="large" />
				<Text color="gray">Checking authentication...</Text>
			</View>
		);
	}

	// User is not signed in, show fallback or sign-in UI
	if (!isUserSignedIn) {
		return fallback ? <>{fallback}</> : null;
	}

	// User is authenticated, show protected content
	return <>{children}</>;
};

export default AuthGuard; 