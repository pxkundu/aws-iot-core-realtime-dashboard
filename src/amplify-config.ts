import { Amplify } from 'aws-amplify';

// Default configuration that will be overridden by outputs
let amplifyConfig: any = {
  Auth: {
    Cognito: {
      userPoolId: 'your-user-pool-id',
      userPoolClientId: 'your-user-pool-client-id',
      identityPoolId: 'your-identity-pool-id',
    },
  },
};

// Function to configure Amplify with backend outputs
export const configureAmplify = async () => {
  try {
    // Try to fetch outputs from the public folder during runtime
    const response = await fetch('/amplify_outputs.json');
    if (response.ok) {
      const outputs = await response.json();
      amplifyConfig = outputs;
      console.log('Using Amplify backend outputs from public folder');
    } else {
      throw new Error('amplify_outputs.json not found in public folder');
    }
  } catch (error) {
    // Try dynamic import as fallback
    try {
      const outputs = await import('../amplify_outputs.json');
      amplifyConfig = outputs.default;
      console.log('Using Amplify backend outputs from import');
    } catch (importError) {
      // Final fallback to environment variables
      console.warn('amplify_outputs.json not found, using environment variables');
      amplifyConfig = {
        Auth: {
          Cognito: {
            userPoolId: (import.meta as any).env?.VITE_USER_POOL_ID || 'your-user-pool-id',
            userPoolClientId: (import.meta as any).env?.VITE_USER_POOL_CLIENT_ID || 'your-user-pool-client-id',
            identityPoolId: (import.meta as any).env?.VITE_IDENTITY_POOL_ID || 'your-identity-pool-id',
          },
        },
      };
    }
  }
  
  Amplify.configure(amplifyConfig);
};

export default amplifyConfig; 