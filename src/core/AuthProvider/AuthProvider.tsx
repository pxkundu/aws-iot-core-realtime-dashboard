/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { FC, ReactNode, createContext, useContext } from "react";
import type { AuthUser } from "aws-amplify/auth";

import useAuthManager from "@demo/hooks/useAuthManager";

interface Props {
	children: ReactNode;
}

interface AuthContextType {
	user: AuthUser | undefined;
	isUserSignedIn: boolean;
	isLoading: boolean;
	checkAuthState: () => Promise<void>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: FC<Props> = ({ children }) => {
	const authData = useAuthManager();

	return (
		<AuthContext.Provider value={authData}>
			{children}
		</AuthContext.Provider>
	);
};

const useAuthContext = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuthContext must be used within AuthProvider");
	}
	return context;
};

export { AuthProvider, useAuthContext }; 