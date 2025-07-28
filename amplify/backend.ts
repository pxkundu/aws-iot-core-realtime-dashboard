import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { createUserProfile } from './functions/createUserProfile/resource';

/**
 * @fileoverview Amplify Gen 2 Backend Definition
 * @see https://docs.amplify.aws/gen2/build-a-backend/
 */
export const backend = defineBackend({
  auth,
  data,
  createUserProfile
});

// Add custom outputs for IoT and Location services
backend.addOutput({
  custom: {
    // These will be populated after deployment
    region: backend.stack.region,
  }
});
