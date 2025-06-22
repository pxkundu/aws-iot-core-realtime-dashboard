/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { FC, lazy, useState } from "react";

import { Auth } from "aws-amplify";
import { Button, Flex, Text } from "@aws-amplify/ui-react";
import { useTranslation } from "react-i18next";
import "./styles.scss";

const Modal = lazy(() => import("@demo/atomicui/atoms/Modal").then(module => ({ default: module.Modal })));

interface SignInModalProps {
	open: boolean;
	onClose: () => void;
	onSignIn: (email: string, password: string) => void;
}

const SignInModal: FC<SignInModalProps> = ({ open, onClose, onSignIn }) => {
	const { t } = useTranslation();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSignUp, setIsSignUp] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const handleSubmit = async () => {
		if (!email || !password) return;
		
		if (isSignUp && password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}
		
		setIsSubmitting(true);
		setError("");
		setSuccess("");
		
		try {
			if (isSignUp) {
				// Sign up with Cognito
				await Auth.signUp({
					username: email,
					password: password,
					attributes: {
						email: email,
					},
				});
				setSuccess("Account created successfully! Please check your email for verification.");
				setIsSignUp(false);
			} else {
				// Sign in with Cognito
				await Auth.signIn(email, password);
				await onSignIn(email, password);
				onClose();
			}
		} catch (error: unknown) {
			console.error("Authentication failed:", error);
			const errorMessage = error instanceof Error ? error.message : "Authentication failed";
			setError(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleToggleMode = () => {
		setIsSignUp(!isSignUp);
		setError("");
		setSuccess("");
		setPassword("");
		setConfirmPassword("");
	};

	const isFormValid = email.trim() && password.trim() && (!isSignUp || confirmPassword.trim());

	return (
		<Modal data-testid="sign-in-modal" open={open} onClose={onClose} className="sign-in-modal">
			<Flex className="sign-in-content" direction="column" alignItems="center">
				<Text className="bold heading" textAlign="center" fontSize="1.54rem" marginBottom="1.23rem">
					{isSignUp ? t("sign_up_modal__title.text") : t("sign_in_modal__1.text")}
				</Text>
				<Text 
					className="regular description" 
					textAlign="center" 
					variation="tertiary"
					marginBottom="2.46rem"
					whiteSpace="pre-line"
				>
					{isSignUp ? t("sign_up_modal__description.text") : t("sign_in_modal__2.text")}
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
				
				{/* Sign-in/Sign-up Form */}
				<Flex direction="column" width="100%" gap="1rem" marginBottom="2rem">
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

					{isSignUp && (
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
				</Flex>

				<Flex direction="column" width="100%" gap="1rem">
					<Button
						data-testid="sign-in-button"
						variation="primary"
						fontFamily="AmazonEmber-Bold"
						height="3.08rem"
						onClick={handleSubmit}
						isDisabled={!isFormValid || isSubmitting}
					>
						{isSubmitting 
							? (isSignUp ? "Creating Account..." : "Signing In...") 
							: (isSignUp ? "Create Account" : t("fm__sign_in_btn.text"))
						}
					</Button>
					
					<Button
						data-testid="toggle-mode-button"
						variation="link"
						fontFamily="AmazonEmber-Regular"
						onClick={handleToggleMode}
						isDisabled={isSubmitting}
					>
						{isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
					</Button>
					
					<Button
						data-testid="maybe-later-button"
						variation="link"
						fontFamily="AmazonEmber-Regular"
						onClick={onClose}
						isDisabled={isSubmitting}
					>
						{t("sign_in_modal__maybe_later.text")}
					</Button>
				</Flex>
			</Flex>
		</Modal>
	);
};

export default SignInModal; 