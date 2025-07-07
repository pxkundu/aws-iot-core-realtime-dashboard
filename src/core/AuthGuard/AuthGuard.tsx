/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { ReactNode } from 'react';
import { Loader, Flex, Text, Button } from '@aws-amplify/ui-react';
import { useAuth } from '@demo/core/AuthProvider';

export interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  showLoader?: boolean;
}

interface AuthStatusProps {
  onSignIn: () => void;
}

const AuthStatus: React.FC<AuthStatusProps> = ({ onSignIn }) => (
  <Flex direction="column" alignItems="center" justifyContent="center" padding="2rem" gap="1rem">
    <Text fontSize="1.2rem" fontWeight="bold" textAlign="center">
      Authentication Required
    </Text>
    <Text textAlign="center" color="gray">
      Please sign in to access this feature
    </Text>
    <Button onClick={onSignIn} variation="primary">
      Sign In
    </Button>
  </Flex>
);

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback, 
  requireAuth = false, // Default to NOT requiring auth - app works for everyone
  showLoader = false   // Default to NOT showing loader - don't block UI
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading state
  if (isLoading && showLoader) {
    return (
      <Flex justifyContent="center" alignItems="center" padding="2rem">
        <Loader size="large" />
      </Flex>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Default fallback - return null or could redirect
    return null;
  }

  // If authentication is not required or user is authenticated, show children
  return <>{children}</>;
};

export { AuthGuard, AuthStatus };
export default AuthGuard; 