import { Amplify } from 'aws-amplify';

// Import the generated configuration
let config;
try {
  config = await import('../amplify_outputs.json');
} catch (error) {
  console.warn('⚠️ amplify_outputs.json not found. Please run "npx ampx sandbox" to deploy your backend.');
  // Minimal fallback config for development
  config = {
    auth: {
      user_pool_id: 'eu-west-1_MKub6mPLO',
      aws_region: 'eu-west-1',
      user_pool_client_id: '6bhakgugqv45l7b1vktjordeog',
      identity_pool_id: '',
    }
  };
}

/**
 * Configure Amplify with Gen 2 backend outputs
 * @see https://docs.amplify.aws/gen2/start/quickstart/nextjs-app-router-client-components/#configure-amplify-library
 */
Amplify.configure(config);

export default config; 