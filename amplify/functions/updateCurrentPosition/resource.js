import { defineFunction } from '@aws-amplify/backend';
export const updateCurrentPosition = defineFunction({
    entry: './handler.ts',
    name: 'updateCurrentPosition',
    timeoutSeconds: 30,
    memoryMB: 256,
    resourceGroupName: 'geo',
    environment: {
        NODE_OPTIONS: '--enable-source-maps'
    }
});
//# sourceMappingURL=resource.js.map