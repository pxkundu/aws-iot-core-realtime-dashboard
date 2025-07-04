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
    // Try to import generated outputs
    const outputs = await import('../amplify_outputs.json');
    amplifyConfig = outputs.default;
    console.log('Using Amplify backend outputs');
  } catch (error) {
    // Fallback to environment variables if outputs file doesn't exist
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
  
  Amplify.configure(amplifyConfig);
};

export default amplifyConfig; 