import { defineFunction } from '@aws-amplify/backend';

export const createTracker = defineFunction({
  entry: './handler.ts',
  name: `createTracker-${process.env.BRANCH_NAME || 'sandbox'}`,
  timeoutSeconds: 30,
  memoryMB: 256,
  resourceGroupName: 'geo',
  environment: {
    NODE_OPTIONS: '--enable-source-maps'
  }
}); 