import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

// Configure Amplify with backend outputs - following official docs
Amplify.configure(outputs);

console.log('✅ Amplify configured with backend outputs');

// Export a function to get current Amplify configuration
export const getCurrentAmplifyConfig = () => {
  return Amplify.getConfig();
}; 