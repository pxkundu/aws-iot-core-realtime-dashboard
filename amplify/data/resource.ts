import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Tracker: a
    .model({
      trackerId: a.string().required(),
      name: a.string().required(),
      description: a.string(),
      region: a.string().required(),
      status: a.enum(['ACTIVE', 'INACTIVE', 'CREATING', 'DELETING']),
      createdAt: a.datetime(),
      lastActivity: a.datetime(),
      // Configuration
      eventFiltering: a.json(),
      kmsKeyId: a.string(),
      tags: a.json(),
      // Relationships
      devices: a.hasMany('Device', 'trackerName')
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ]),

  Device: a
    .model({
      deviceId: a.string().required(),
      name: a.string().required(),
      description: a.string(),
      latitude: a.float(),
      longitude: a.float(),
      status: a.enum(['ACTIVE', 'INACTIVE', 'OFFLINE']),
      trackerName: a.string(),
      lastUpdated: a.datetime(),
      // Relationships
      assignments: a.hasMany('DeviceAssignment', 'deviceId'),
      tracker: a.belongsTo('Tracker', 'trackerName')
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ]),

  Geofence: a
    .model({
      geofenceId: a.string().required(),
      name: a.string().required(),
      description: a.string(),
      geometry: a.string().required(), // GeoJSON string
      status: a.enum(['ACTIVE', 'INACTIVE']),
      // Relationships
      assignments: a.hasMany('DeviceAssignment', 'geofenceId')
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ]),

  DeviceAssignment: a
    .model({
      deviceId: a.id().required(),
      geofenceId: a.id().required(),
      status: a.enum(['ACTIVE', 'INACTIVE']),
      assignedAt: a.datetime(),
      // Relationships
      device: a.belongsTo('Device', 'deviceId'),
      geofence: a.belongsTo('Geofence', 'geofenceId')
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
}); 