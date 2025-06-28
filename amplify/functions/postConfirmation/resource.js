import { defineFunction } from '@aws-amplify/backend';
export const postConfirmation = defineFunction({
    entry: './handler.ts',
    name: 'postConfirmation',
    timeoutSeconds: 30,
    memoryMB: 256,
    resourceGroupName: 'postConfirmation',
    environment: {
        NODE_OPTIONS: '--enable-source-maps'
    }
});
//# sourceMappingURL=resource.js.map