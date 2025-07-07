import { Amplify } from 'aws-amplify';

// Function to configure Amplify with backend outputs
export const configureAmplify = async () => {
  try {
    // Try to fetch outputs from the deployed folder during runtime
    const response = await fetch('/amplify_outputs.json');
    if (response.ok) {
      const outputs = await response.json();
      // Configure Amplify with the outputs directly - this is the official way
      Amplify.configure(outputs);
      console.log('✅ Amplify configured with backend outputs from deployed file');
    } else {
      throw new Error('amplify_outputs.json not found');
    }
  } catch {
    // Fallback configuration for development
    console.warn('⚠️ amplify_outputs.json not found, using fallback configuration');
    const fallbackConfig = {
      Auth: {
        Cognito: {
          userPoolId: (import.meta.env as Record<string, string>)?.VITE_USER_POOL_ID || 'your-user-pool-id',
          userPoolClientId: (import.meta.env as Record<string, string>)?.VITE_USER_POOL_CLIENT_ID || 'your-user-pool-client-id',
          identityPoolId: (import.meta.env as Record<string, string>)?.VITE_IDENTITY_POOL_ID || 'your-identity-pool-id',
        },
      },
    };
    Amplify.configure(fallbackConfig);
  }
};

// Export a function to get current Amplify configuration
export const getCurrentAmplifyConfig = () => {
  return Amplify.getConfig();
}; 