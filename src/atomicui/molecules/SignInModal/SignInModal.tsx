/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { FC, lazy, useState } from "react";

import { signIn, signUp, confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { Button, Flex, Text } from "@aws-amplify/ui-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@demo/core/AuthProvider";
import "./styles.scss";

const Modal = lazy(() => import("@demo/atomicui/atoms/Modal").then(module => ({ default: module.Modal })));

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  onSignIn?: (email: string, password: string) => void;
}

type AuthStep = 'signIn' | 'signUp' | 'confirmSignUp';

const SignInModal: FC<SignInModalProps> = ({ open, onClose, onSignIn }) => {
  const { t } = useTranslation();
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<AuthStep>('signIn');
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    if (currentStep === 'signIn') {
      if (!email || !password) return;
      
      setIsSubmitting(true);
      setError("");
      setSuccess("");
      
      try {
        await signIn({ username: email, password: password });
        // Refresh auth state
        await refreshAuth();
        // Call optional callback
        if (onSignIn) {
          await onSignIn(email, password);
        }
        onClose();
        setSuccess("Successfully signed in!");
      } catch (error: unknown) {
        console.error("Sign in failed:", error);
        const errorMessage = error instanceof Error ? error.message : "Sign in failed";
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 'signUp') {
      if (!email || !password || !confirmPassword) return;
      
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      
      setIsSubmitting(true);
      setError("");
      setSuccess("");
      
      try {
        await signUp({
          username: email,
          password: password,
          options: {
            userAttributes: {
              email: email,
            },
          },
        });
        setSuccess("Account created successfully! Please check your email for verification code.");
        setCurrentStep('confirmSignUp');
      } catch (error: unknown) {
        console.error("Sign up failed:", error);
        const errorMessage = error instanceof Error ? error.message : "Sign up failed";
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 'confirmSignUp') {
      if (!email || !confirmationCode) return;
      
      setIsSubmitting(true);
      setError("");
      setSuccess("");
      
      try {
        await confirmSignUp({
          username: email,
          confirmationCode: confirmationCode,
        });
        setSuccess("Email confirmed! You can now sign in.");
        setCurrentStep('signIn');
        setConfirmationCode("");
      } catch (error: unknown) {
        console.error("Confirmation failed:", error);
        const errorMessage = error instanceof Error ? error.message : "Confirmation failed";
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    
    setIsSubmitting(true);
    setError("");
    
    try {
      await resendSignUpCode({ username: email });
      setSuccess("Verification code resent to your email!");
    } catch (error: unknown) {
      console.error("Resend failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to resend code";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMode = () => {
    if (currentStep === 'signIn') {
      setCurrentStep('signUp');
    } else {
      setCurrentStep('signIn');
    }
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
    setConfirmationCode("");
  };

  const getFormValid = () => {
    if (currentStep === 'signIn') {
      return email.trim() && password.trim();
    } else if (currentStep === 'signUp') {
      return email.trim() && password.trim() && confirmPassword.trim();
    } else if (currentStep === 'confirmSignUp') {
      return email.trim() && confirmationCode.trim();
    }
    return false;
  };

  const isFormValid = getFormValid();

  return (
    <Modal data-testid="sign-in-modal" open={open} onClose={onClose} className="sign-in-modal">
      <Flex className="sign-in-content" direction="column" alignItems="center">
        <Text className="bold heading" textAlign="center" fontSize="1.54rem" marginBottom="1.23rem">
          {currentStep === 'signUp' ? t("sign_up_modal__title.text") : 
           currentStep === 'confirmSignUp' ? "Confirm Your Email" :
           t("sign_in_modal__1.text")}
        </Text>
        <Text 
          className="regular description" 
          textAlign="center" 
          variation="tertiary"
          marginBottom="2.46rem"
          whiteSpace="pre-line"
        >
          {currentStep === 'signUp' ? t("sign_up_modal__description.text") :
           currentStep === 'confirmSignUp' ? "Enter the verification code sent to your email" :
           t("sign_in_modal__2.text")}
        </Text>
        
        {/* Error/Success Messages */}
        {error && (
          <Text className="error-message" color="red" marginBottom="1rem">
            {error}
          </Text>
        )}
        {success && (
          <Text className="success-message" color="green" marginBottom="1rem">
            {success}
          </Text>
        )}
        
        {/* Authentication Form */}
        <Flex direction="column" width="100%" gap="1rem" marginBottom="2rem">
          {currentStep !== 'confirmSignUp' && (
            <>
              <Flex direction="column" gap="0.5rem">
                <Text className="form-label">Email</Text>
                <input
                  data-testid="sign-in-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="sign-in-input"
                  disabled={isSubmitting}
                />
              </Flex>
              
              <Flex direction="column" gap="0.5rem">
                <Text className="form-label">Password</Text>
                <input
                  data-testid="sign-in-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="sign-in-input"
                  disabled={isSubmitting}
                />
              </Flex>

              {currentStep === 'signUp' && (
                <Flex direction="column" gap="0.5rem">
                  <Text className="form-label">Confirm Password</Text>
                  <input
                    data-testid="sign-in-confirm-password-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="sign-in-input"
                    disabled={isSubmitting}
                  />
                </Flex>
              )}
            </>
          )}

          {currentStep === 'confirmSignUp' && (
            <>
              <Flex direction="column" gap="0.5rem">
                <Text className="form-label">Email</Text>
                <Text className="email-display">{email}</Text>
              </Flex>
              
              <Flex direction="column" gap="0.5rem">
                <Text className="form-label">Verification Code</Text>
                <input
                  data-testid="confirmation-code-input"
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  placeholder="Enter verification code"
                  className="sign-in-input"
                  disabled={isSubmitting}
                />
              </Flex>
            </>
          )}
        </Flex>

        <Flex direction="column" width="100%" gap="1rem">
          <Button
            data-testid="auth-submit-button"
            variation="primary"
            fontFamily="AmazonEmber-Bold"
            height="3.08rem"
            onClick={handleSubmit}
            isDisabled={!isFormValid || isSubmitting}
          >
            {isSubmitting 
              ? (currentStep === 'signUp' ? "Creating Account..." : 
                 currentStep === 'confirmSignUp' ? "Confirming..." : "Signing In...") 
              : (currentStep === 'signUp' ? "Create Account" : 
                 currentStep === 'confirmSignUp' ? "Confirm Email" : t("fm__sign_in_btn.text"))
            }
          </Button>
          
          {currentStep === 'confirmSignUp' && (
            <Button
              data-testid="resend-code-button"
              variation="link"
              fontFamily="AmazonEmber-Regular"
              onClick={handleResendCode}
              isDisabled={isSubmitting}
            >
              Resend Code
            </Button>
          )}
          
          {currentStep !== 'confirmSignUp' && (
            <Button
              data-testid="toggle-mode-button"
              variation="link"
              fontFamily="AmazonEmber-Regular"
              onClick={handleToggleMode}
              isDisabled={isSubmitting}
            >
              {currentStep === 'signUp' ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </Button>
          )}
          
          <Button
            data-testid="maybe-later-button"
            variation="link"
            fontFamily="AmazonEmber-Regular"
            onClick={onClose}
            isDisabled={isSubmitting}
          >
            {currentStep === 'confirmSignUp' ? "Back to Sign In" : t("sign_in_modal__maybe_later.text")}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default SignInModal; 