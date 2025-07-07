/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { useEffect, useState } from 'react';
import { getCurrentUser, signOut, fetchAuthSession, AuthUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export interface AuthState {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

export interface AuthContextType extends AuthState {
	signOut: () => Promise<void>;
	clearError: () => void;
	refreshAuth: () => Promise<void>;
}

const useAuthManager = (): AuthContextType => {
	const [authState, setAuthState] = useState<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: false, // Start with false so app loads immediately
		error: null,
	});

	const clearError = () => {
		setAuthState(prev => ({ ...prev, error: null }));
	};

	const checkAuthState = async () => {
		try {
			// Don't set loading state - check auth silently in background
			
			// Get current user
			const user = await getCurrentUser();
			
			// Verify session is valid
			const session = await fetchAuthSession();
			
			if (user && session.tokens) {
				console.log('✅ User authenticated:', user.username);
				setAuthState(prev => ({
					...prev,
					user,
					isAuthenticated: true,
					error: null,
				}));
			} else {
				console.log('ℹ️ No user session found');
				setAuthState(prev => ({
					...prev,
					user: null,
					isAuthenticated: false,
					error: null,
				}));
			}
		} catch (error) {
			// This is expected when no user is signed in - not an error condition
			if (error instanceof Error && error.name === 'UserUnAuthenticatedException') {
				console.log('ℹ️ No authenticated user found (this is normal for new visitors)');
			} else {
				console.log('⚠️ Authentication check failed:', error);
			}
			setAuthState(prev => ({
				...prev,
				user: null,
				isAuthenticated: false,
				error: null, // Don't treat "not authenticated" as an error
			}));
		}
	};

	const handleSignOut = async () => {
		try {
			await signOut();
			setAuthState(prev => ({
				...prev,
				user: null,
				isAuthenticated: false,
				error: null,
			}));
		} catch (error) {
			console.error('Sign out error:', error);
			setAuthState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Sign out failed',
			}));
		}
	};

	const refreshAuth = async () => {
		await checkAuthState();
	};

	useEffect(() => {
		// Check auth state on mount
		checkAuthState();

		// Listen to auth events
		const hubListener = (data: { payload: { event: string } }) => {
			const { event } = data.payload;
			
			switch (event) {
				case 'signedIn':
					console.log('User signed in');
					checkAuthState();
					break;
				case 'signedOut':
					console.log('User signed out');
					setAuthState(prev => ({
						...prev,
						user: null,
						isAuthenticated: false,
						error: null,
					}));
					break;
				case 'tokenRefresh':
					console.log('Token refreshed');
					checkAuthState();
					break;
				case 'signInFailure':
					console.log('Sign in failure');
					setAuthState(prev => ({
						...prev,
						error: 'Sign in failed',
					}));
					break;
				default:
					break;
			}
		};

		const unsubscribe = Hub.listen('auth', hubListener);

		return () => {
			unsubscribe();
		};
	}, []);

	return {
		...authState,
		signOut: handleSignOut,
		clearError,
		refreshAuth,
	};
};

export default useAuthManager;
