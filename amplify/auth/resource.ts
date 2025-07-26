import { defineAuth } from "@aws-amplify/backend";

/**
 * Define and configure your auth resource with enhanced user registration
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true
  },
  userAttributes: {
    email: { required: true }
  },
  groups: ['Admins', 'Users']
});
