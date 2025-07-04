import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';

/**
 * Simplified Amplify backend with only authentication
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
const backend = defineBackend({
  auth
});
