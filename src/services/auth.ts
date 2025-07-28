import { 
  signIn, 
  signUp, 
  signOut, 
  getCurrentUser, 
  confirmSignUp, 
  resendSignUpCode, 
  resetPassword, 
  confirmResetPassword,
  fetchAuthSession
} from 'aws-amplify/auth';
import type { AuthUser } from 'aws-amplify/auth';

/**
 * Authentication service using Amplify Gen 2 Auth
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth/connect-your-frontend/
 */

export interface AuthResult {
  success: boolean;
  data?: any;
  error?: string;
  nextStep?: any;
}

export const authService = {
  /**
   * Sign in a user with email and password
   */
  signIn: async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await signIn({
        username: email,
        password
      });

      if (result.isSignedIn) {
        const user = await getCurrentUser();
        return {
          success: true,
          data: user
        };
      } else {
        return {
          success: false,
          error: 'Sign in requires additional steps',
          nextStep: result.nextStep
        };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: (error as Error).message || 'Sign in failed'
      };
    }
  },

  /**
   * Sign up a new user with email and password
   */
  signUp: async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email
          }
        }
      });

      return {
        success: true,
        data: result,
        nextStep: result.nextStep
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: (error as Error).message || 'Sign up failed'
      };
    }
  },

  /**
   * Confirm user sign up with verification code
   */
  confirmSignUp: async (email: string, code: string): Promise<AuthResult> => {
    try {
      const result = await confirmSignUp({
        username: email,
        confirmationCode: code
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Confirm sign up error:', error);
      return {
        success: false,
        error: (error as Error).message || 'Email confirmation failed'
      };
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async (): Promise<AuthResult> => {
    try {
      await signOut();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: (error as Error).message || 'Sign out failed'
      };
    }
  },

  /**
   * Get the current authenticated user
   */
  getCurrentUser: async (): Promise<AuthResult> => {
    try {
      const user = await getCurrentUser();
      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to get current user'
      };
    }
  },

  /**
   * Resend confirmation code for sign up
   */
  resendConfirmationCode: async (email: string): Promise<AuthResult> => {
    try {
      const result = await resendSignUpCode({
        username: email
      });
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Resend confirmation code error:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to resend confirmation code'
      };
    }
  },

  /**
   * Reset user password
   */
  resetPassword: async (email: string): Promise<AuthResult> => {
    try {
      const result = await resetPassword({
        username: email
      });
      return {
        success: true,
        data: result,
        nextStep: result.nextStep
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: (error as Error).message || 'Password reset failed'
      };
    }
  },

  /**
   * Confirm password reset with code
   */
  confirmResetPassword: async (
    email: string, 
    code: string, 
    newPassword: string
  ): Promise<AuthResult> => {
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword
      });
      return { success: true };
    } catch (error) {
      console.error('Confirm reset password error:', error);
      return {
        success: false,
        error: (error as Error).message || 'Password confirmation failed'
      };
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    try {
      await getCurrentUser();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get the current auth session with tokens
   */
  getAuthSession: async (): Promise<AuthResult> => {
    try {
      const session = await fetchAuthSession();
      return {
        success: true,
        data: session
      };
    } catch (error) {
      console.error('Get auth session error:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to get auth session'
      };
    }
  }
};

// Export types for use in components
export type { AuthUser }; 