import { auth } from "@aws-amplify/backend";

export const myAuth = auth({
  loginWith: {
    email: true,
    // username: true, // enable if you want username login
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
  passwordPolicy: {
    minLength: 8,
    requireNumbers: true,
    requireUppercase: true,
    requireLowercase: true,
    requireSymbols: false,
  },
  multiFactorAuth: {
    mode: "OFF", // or "OPTIONAL" or "REQUIRED"
  },
  // Optional: Configure account recovery
  accountRecovery: {
    mode: "EMAIL_ONLY", // or "EMAIL_AND_PHONE_WITHOUT_MFA"
  },
  // Optional: Configure verification
  verification: {
    email: true,
    phone: false,
  },
}); 