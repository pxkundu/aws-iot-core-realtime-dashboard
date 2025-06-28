import { defineFunction } from '@aws-amplify/backend';

// Global type declarations for Node.js environment
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            BRANCH_NAME?: string;
        }
    }
}

export const handleTrackerAllocation = defineFunction({
  entry: './handler.ts',
  name: `handleTrackerAllocation-${process.env.BRANCH_NAME || 'sandbox'}`,
  timeoutSeconds: 30,
  memoryMB: 256,
  resourceGroupName: 'data',
  environment: {
    NODE_OPTIONS: '--enable-source-maps'
  }
}); 