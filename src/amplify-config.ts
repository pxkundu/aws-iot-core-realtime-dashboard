import { Amplify } from 'aws-amplify';

// Configuration for Amplify with Cognito authentication
const amplifyConfig = {
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

export const configureAmplify = () => {
  Amplify.configure(amplifyConfig);
};

export default amplifyConfig; 