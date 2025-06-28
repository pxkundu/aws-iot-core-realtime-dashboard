import { defineFunction } from '@aws-amplify/backend';
export const handleTrackerAllocation = defineFunction({
    entry: './handler.ts',
    name: 'handleTrackerAllocation',
    timeoutSeconds: 30,
    memoryMB: 256,
    resourceGroupName: 'data',
    environment: {
        NODE_OPTIONS: '--enable-source-maps'
    }
});
//# sourceMappingURL=resource.js.map