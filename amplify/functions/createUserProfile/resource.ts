import { defineFunction } from '@aws-amplify/backend';

export const createUserProfile = defineFunction({
  name: 'createUserProfile',
  entry: './handler.ts',
  environment: {
    DEVICES_TABLE_NAME: '${custom.devicesTableName}'
  }
}); 