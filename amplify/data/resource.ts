import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/

// Resource name validation
const validateResourceName = (name: string, resourceType: string): void => {
  if (name.length > 63) {
    throw new Error(`${resourceType} name too long: ${name}`);
  }
};

// Get environment and branch information
const getResourceSuffix = (): string => {
  const branch = process.env.AWS_BRANCH || 'main';
  
  // Add validation for branch name
  if (branch.length > 63) {
    throw new Error('Branch name too long for AWS resource naming');
  }
  
  // Clean branch name to be AWS resource name compatible
  const cleanBranch = branch.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  
  if (process.env.ENVIRONMENT === 'sandbox') return `sandbox-${cleanBranch}`;
  if (process.env.ENVIRONMENT === 'prod') return `prod-${cleanBranch}`;
  return `dev-${cleanBranch}`;
};

const resourceSuffix = getResourceSuffix();

// Define table names with resource suffix
const trackerDataTableName = 'TrackerDataTable';
const userDataTableName = 'UserDataTable';

validateResourceName(trackerDataTableName, 'Table');
validateResourceName(userDataTableName, 'Table');

const schema = a.schema({
  TrackerData: a
    .model({
      deviceId: a.string().required(),
      currentPosition: a.string(), // Storing as "latitude,longitude"
      timestamp: a.datetime(),
      geofenceCollectionId: a.string(), // ID of the dedicated geofence collection for this device
      userId: a.string(),
      user: a.belongsTo('UserData', 'userId'), // Link to the owning user with userId field
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read']),
    ]),
  UserData: a
    .model({
      userId: a.string().required(),
      email: a.string().required(),
      trackers: a.hasMany('TrackerData', 'userId'),
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read']),
    ]),

  // Asset Tracker table
  AssetTracker: a
    .model({
      // User identification
      userId: a.string(),
      userEmail: a.string(),
      
      // Asset details
      assetId: a.string(),
      assetName: a.string(),
      assetType: a.string(),
      assetDescription: a.string(),
      
      // Location tracking
      lastKnownLocation: a.string(), // Stored as GeoJSON point
      lastLocationUpdate: a.datetime(),
      locationHistory: a.string(), // Array of GeoJSON points stored as JSON string
      
      // Status and metadata
      status: a.enum(['inside', 'outside', 'unknown']),
      batteryLevel: a.float(),
      signalStrength: a.float(),
      lastUpdateTime: a.datetime(),
      
      // Timestamps
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      
      // Additional metadata
      metadata: a.string(), // JSON string for additional custom fields
      tags: a.string(), // Array of tags stored as JSON string

      // Relationships
      assetTrackerGeofences: a.hasMany('AssetTrackerGeofence', 'assetTrackerId'),
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read']),
      allow.guest().to(['read'])
    ]),

  // Geo Fence table
  GeoFence: a
    .model({
      // User identification
      userId: a.string(),
      userEmail: a.string(),
      
      // Geo fence details
      geofenceId: a.string(),
      geofenceName: a.string(),
      geofenceGeometry: a.string(), // Stored as GeoJSON string
      geofenceStatus: a.enum(['active', 'inactive', 'deleted']),
      description: a.string(),
      
      // Timestamps
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      
      // Additional metadata
      metadata: a.string(), // JSON string for additional custom fields
      tags: a.string(), // Array of tags stored as JSON string

      // Relationships
      assetTrackerGeofences: a.hasMany('AssetTrackerGeofence', 'geofenceId'),
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read']),
      allow.guest().to(['read'])
    ]),

  // Junction table for many-to-many relationship
  AssetTrackerGeofence: a
    .model({
      // Reference fields for the many-to-many relationship
      assetTrackerId: a.id().required(),
      geofenceId: a.id().required(),
      
      // Relationships
      assetTracker: a.belongsTo('AssetTracker', 'assetTrackerId'),
      geofence: a.belongsTo('GeoFence', 'geofenceId'),
      
      // Additional metadata for the relationship
      assignedAt: a.datetime(),
      status: a.enum(['active', 'inactive']),
      metadata: a.string(), // JSON string for additional custom fields
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read']),
      allow.guest().to(['read'])
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30
    }
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>