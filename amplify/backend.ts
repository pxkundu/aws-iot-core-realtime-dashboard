import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { createUserProfile } from './functions/createUserProfile/resource';

// Custom CDK resources
import { NotificationSystemConstruct } from './custom/NotificationSystem/resource';
import { DeviceManagementConstruct } from './custom/DeviceManagement/resource';
import { DatabaseConstruct } from './custom/Database/resource';

/**
 * Amplify backend with authentication and custom CDK resources
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
const backend = defineBackend({
  auth,
  createUserProfile
});

// Custom CDK stacks for IoT and notifications
const notificationStack = backend.createStack('Notifications');
const deviceStack = backend.createStack('DeviceManagement');
const databaseStack = backend.createStack('Database');

// Add custom constructs
const database = new DatabaseConstruct(databaseStack, 'Database');

const notifications = new NotificationSystemConstruct(notificationStack, 'Notifications', {
  sourceEmail: 'noreply@yourdomain.com'
});

const deviceMgmt = new DeviceManagementConstruct(deviceStack, 'DeviceManagement', {
  environment: 'dev',
  notificationTopicArn: notifications.topicArn,
  devicesTableName: database.devicesTable.tableName,
  assignmentsTableName: database.geofenceAssignmentsTable.tableName
});

// Export outputs for frontend
backend.addOutput({
  custom: {
    iotEndpoint: deviceMgmt.iotEndpoint,
    notificationTopicArn: notifications.topicArn,
    devicesTableName: database.devicesTable.tableName,
    assignmentsTableName: database.geofenceAssignmentsTable.tableName
  }
});
