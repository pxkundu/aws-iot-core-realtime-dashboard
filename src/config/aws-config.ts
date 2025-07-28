// AWS Configuration for IoT Dashboard
export const awsConfig = {
  region: 'eu-west-1',
  tables: {
    devices: 'aws-iot-dashboard-devices',
    assignments: 'aws-iot-dashboard-assignments'
  },
  collections: {
    geofences: 'aws-iot-dashboard-dev-geofences'
  },
  services: {
    location: {
      region: 'eu-west-1'
    },
    dynamodb: {
      region: 'eu-west-1'
    }
  }
};

// Environment variables - using Vite's import.meta.env
export const envConfig = {
  AWS_REGION: import.meta.env.VITE_AWS_REGION || 'eu-west-1',
  DEVICES_TABLE: import.meta.env.VITE_DEVICES_TABLE || 'aws-iot-dashboard-devices',
  ASSIGNMENTS_TABLE: import.meta.env.VITE_ASSIGNMENTS_TABLE || 'aws-iot-dashboard-assignments',
  GEOFENCE_COLLECTION: import.meta.env.VITE_GEOFENCE_COLLECTION || 'aws-iot-dashboard-dev-geofences'
}; 