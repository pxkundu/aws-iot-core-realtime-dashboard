import { defineFunction } from '@aws-amplify/backend';

// Global type declarations for Node.js environment
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            BRANCH_NAME?: string;
        }
    }
}

export const sendNotification = defineFunction({
  entry: './handler.ts',
  name: `sendNotification-${process.env.BRANCH_NAME || 'sandbox'}`,
  timeoutSeconds: 30,
  memoryMB: 256,
  resourceGroupName: 'data',
  environment: {
    NODE_OPTIONS: '--enable-source-maps',
    ADMIN_EMAIL_ADDRESS: 'inboxkundu@gmail.com',
    SENDER_EMAIL_ADDRESS: 'inboxkundu@gmail.com',
  },
}); 