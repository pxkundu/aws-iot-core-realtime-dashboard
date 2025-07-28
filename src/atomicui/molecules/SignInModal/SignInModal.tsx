/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { FC, useState } from "react";
import { 
  Button, 
  Flex, 
  Text, 
  TextField, 
  Alert,
  Card,
  Divider,
  View
} from "@aws-amplify/ui-react";
import { useTranslation } from "react-i18next";
import { 
  signIn, 
  signUp, 
  confirmSignUp, 
  resetPassword, 
  confirmResetPassword,
  resendSignUpCode
} from "aws-amplify/auth";
import { useAuthContext } from "@demo/core/AuthProvider";
import "./styles.scss";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  onSignIn?: () => void;
}

type AuthStep = "signIn" | "signUp" | "confirmSignUp" | "forgotPassword" | "confirmResetPassword";

/**
 * Complete Authentication Modal using Amplify UI Components
 * Matches the original project design patterns
 */
const SignInModal: FC<SignInModalProps> = ({ open, onClose, onSignIn }) => {
  const { t } = useTranslation();
  const { checkAuthState } = useAuthContext();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState<AuthStep>("signIn");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setConfirmationCode("");
    setNewPassword("");
    clearMessages();
    setStep("signIn");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ============ SIGN IN ============
  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      const result = await signIn({
        username: email,
        password: password,
      });

      if (result.isSignedIn) {
        console.log("✅ User signed in successfully");
        setSuccess("Welcome back! Signing you in...");
        await checkAuthState();
        onSignIn?.();
        handleClose();
      } else {
        console.log("Sign in requires additional steps:", result.nextStep);
        setError("Additional verification required");
      }
    } catch (err: any) {
      console.error("❌ Sign in error:", err);
      if (err.name === "UserNotFoundException") {
        setError("No account found with this email. Would you like to create one?");
      } else if (err.name === "NotAuthorizedException") {
        setError("Invalid email or password. Please try again.");
      } else if (err.name === "UserNotConfirmedException") {
        setError("Please confirm your email first");
        setStep("confirmSignUp");
      } else {
        setError(err.message || "Sign in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============ SIGN UP ============
  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      const result = await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: {
            email: email,
          },
        },
      });

      console.log("✅ Sign up successful:", result);
      setSuccess("Account created! Please check your email for a verification code.");
      setStep("confirmSignUp");
    } catch (err: any) {
      console.error("❌ Sign up error:", err);
      if (err.name === "UsernameExistsException") {
        setError("An account with this email already exists. Try signing in instead.");
      } else {
        setError(err.message || "Account creation failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============ CONFIRM SIGN UP ============
  const handleConfirmSignUp = async () => {
    if (!email || !confirmationCode) {
      setError("Please enter the confirmation code from your email");
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      await confirmSignUp({
        username: email,
        confirmationCode: confirmationCode,
      });

      console.log("✅ Email confirmed successfully");
      setSuccess("Email verified! You can now sign in.");
      setStep("signIn");
      setConfirmationCode("");
    } catch (err: any) {
      console.error("❌ Confirmation error:", err);
      if (err.name === "CodeMismatchException") {
        setError("Invalid verification code. Please check and try again.");
      } else if (err.name === "ExpiredCodeException") {
        setError("Verification code has expired. Request a new one.");
      } else {
        setError(err.message || "Email verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============ RESEND CONFIRMATION ============
  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      await resendSignUpCode({ username: email });
      setSuccess("New verification code sent to your email!");
    } catch (err: any) {
      console.error("❌ Resend confirmation error:", err);
      setError(err.message || "Failed to resend verification code");
    } finally {
      setIsLoading(false);
    }
  };

  // ============ FORGOT PASSWORD ============
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      await resetPassword({ username: email });
      setSuccess("Password reset code sent to your email!");
      setStep("confirmResetPassword");
    } catch (err: any) {
      console.error("❌ Forgot password error:", err);
      if (err.name === "UserNotFoundException") {
        setError("No account found with this email address");
      } else {
        setError(err.message || "Failed to send password reset code");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============ CONFIRM RESET PASSWORD ============
  const handleConfirmResetPassword = async () => {
    if (!email || !confirmationCode || !newPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: confirmationCode,
        newPassword: newPassword,
      });

      console.log("✅ Password reset successful");
      setSuccess("Password reset successful! You can now sign in with your new password.");
      setStep("signIn");
      setConfirmationCode("");
      setNewPassword("");
    } catch (err: any) {
      console.error("❌ Reset password error:", err);
      if (err.name === "CodeMismatchException") {
        setError("Invalid reset code. Please check and try again.");
      } else if (err.name === "ExpiredCodeException") {
        setError("Reset code has expired. Request a new one.");
      } else {
        setError(err.message || "Password reset failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (step) {
      case "signIn": return t("fm__sign_in_btn.text") || "Welcome Back";
      case "signUp": return "Create Account";
      case "confirmSignUp": return "Verify Your Email";
      case "forgotPassword": return "Reset Password";
      case "confirmResetPassword": return "Set New Password";
      default: return "Authentication";
    }
  };

  const getModalDescription = () => {
    switch (step) {
      case "signIn": return "Sign in to your account";
      case "signUp": return "Create a new account to get started";
      case "confirmSignUp": return "Enter the verification code sent to your email";
      case "forgotPassword": return "Enter your email to receive a reset code";
      case "confirmResetPassword": return "Enter the reset code and your new password";
      default: return "";
    }
  };

  if (!open) return null;

  return (
    <div className="sign-in-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <Card className="sign-in-modal">
        <Flex direction="column">
          
          {/* Header */}
          <div className="modal-header">
            <div className="modal-title">
              {getModalTitle()}
            </div>
            <div className="modal-description">
              {getModalDescription()}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert variation="error" isDismissible onDismiss={clearMessages}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variation="success" isDismissible onDismiss={clearMessages}>
              {success}
            </Alert>
          )}

          {/* Form Fields */}
          <div className="form-section">
            
            {/* Email Field */}
            {["signIn", "signUp", "forgotPassword"].includes(step) && (
              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                isRequired
                isDisabled={isLoading}
                autoComplete="email"
              />
            )}

            {/* Password Field */}
            {["signIn", "signUp"].includes(step) && (
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                isRequired
                isDisabled={isLoading}
                autoComplete={step === "signIn" ? "current-password" : "new-password"}
              />
            )}

            {/* Confirm Password Field */}
            {step === "signUp" && (
              <TextField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                isRequired
                isDisabled={isLoading}
                autoComplete="new-password"
              />
            )}

            {/* Confirmation Code Field */}
            {["confirmSignUp", "confirmResetPassword"].includes(step) && (
              <TextField
                label="Verification Code"
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="Enter 6-digit verification code"
                isRequired
                isDisabled={isLoading}
                maxLength={6}
              />
            )}

            {/* New Password Field */}
            {step === "confirmResetPassword" && (
              <TextField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                isRequired
                isDisabled={isLoading}
                autoComplete="new-password"
              />
            )}

          </div>

          {/* Action Buttons */}
          <div className="button-section">
            
            {step === "signIn" && (
              <>
                <Button
                  variation="primary"
                  onClick={handleSignIn}
                  isLoading={isLoading}
                  loadingText="Signing in..."
                  isFullWidth
                  size="large"
                >
                  {t("fm__sign_in_btn.text") || "Sign In"}
                </Button>
                <Flex justifyContent="center" marginTop="0.75rem">
                  <Button
                    variation="link"
                    onClick={() => setStep("forgotPassword")}
                    isDisabled={isLoading}
                  >
                    Forgot your password?
                  </Button>
                </Flex>
              </>
            )}

            {step === "signUp" && (
              <Button
                variation="primary"
                onClick={handleSignUp}
                isLoading={isLoading}
                loadingText="Creating account..."
                isFullWidth
                size="large"
              >
                Create Account
              </Button>
            )}

            {step === "confirmSignUp" && (
              <>
                <Button
                  variation="primary"
                  onClick={handleConfirmSignUp}
                  isLoading={isLoading}
                  loadingText="Verifying..."
                  isFullWidth
                  size="large"
                >
                  Verify Email
                </Button>
                <Flex justifyContent="center" marginTop="0.75rem">
                  <Button
                    variation="link"
                    onClick={handleResendConfirmation}
                    isDisabled={isLoading}
                  >
                    Resend verification code
                  </Button>
                </Flex>
              </>
            )}

            {step === "forgotPassword" && (
              <Button
                variation="primary"
                onClick={handleForgotPassword}
                isLoading={isLoading}
                loadingText="Sending code..."
                isFullWidth
                size="large"
              >
                Send Reset Code
              </Button>
            )}

            {step === "confirmResetPassword" && (
              <Button
                variation="primary"
                onClick={handleConfirmResetPassword}
                isLoading={isLoading}
                loadingText="Resetting password..."
                isFullWidth
                size="large"
              >
                Reset Password
              </Button>
            )}

          </div>

          {/* Step Navigation */}
          <div className="navigation-section">
            <Flex direction="row" justifyContent="space-between" alignItems="center">
              
              {step === "signIn" && (
                <>
                  <Text className="navigation-text">New here?</Text>
                  <Button
                    className="navigation-button"
                    variation="link"
                    onClick={() => setStep("signUp")}
                    isDisabled={isLoading}
                  >
                    Create Account
                  </Button>
                </>
              )}

              {["signUp", "confirmSignUp", "forgotPassword", "confirmResetPassword"].includes(step) && (
                <>
                  <Text className="navigation-text">Remember your password?</Text>
                  <Button
                    className="navigation-button"
                    variation="link"
                    onClick={() => setStep("signIn")}
                    isDisabled={isLoading}
                  >
                    Sign In
                  </Button>
                </>
              )}

            </Flex>
          </div>

          {/* Close Button */}
          <div className="close-section">
            <Button 
              className="close-button"
              variation="link" 
              onClick={handleClose} 
              isDisabled={isLoading}
            >
              Cancel
            </Button>
          </div>

        </Flex>
      </Card>
    </div>
  );
};

export default SignInModal; 