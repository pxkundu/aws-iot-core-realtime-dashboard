import { Amplify } from 'aws-amplify';

// Import the generated configuration from Amplify Gen 2
// This file will be available after the backend is deployed
let amplifyConfig: any;

try {
  // Try to import the generated config from Amplify Gen 2
  amplifyConfig = require('../amplify_outputs.json');
} catch (error) {
  // Fallback configuration for development
  console.warn('amplify_outputs.json not found, using fallback configuration');
  amplifyConfig = {
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_USER_POOL_ID || 'your-user-pool-id',
        userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || 'your-user-pool-client-id',
        identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID || 'your-identity-pool-id',
        signUpVerificationMethod: 'code', // 'code' | 'link'
        loginWith: {
          email: true,
          username: false,
        },
      },
    },
    // Keep existing configuration for other services
    API: {
      Geo: {
        endpoint: import.meta.env.VITE_AWS_GEO_ENDPOINT,
        region: import.meta.env.VITE_AWS_REGION || 'eu-west-1',
      },
    },
  };
}

export const configureAmplify = () => {
  Amplify.configure(amplifyConfig);
};

export default amplifyConfig; 