import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { Policy, PolicyStatement, Effect, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { CfnMap, CfnGeofenceCollection, CfnPlaceIndex } from "aws-cdk-lib/aws-location";
import { Stack } from "aws-cdk-lib";
import { CfnTopicRule } from 'aws-cdk-lib/aws-iot';
import { Rule, RuleTargetInput, EventBus } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { HttpMethods } from 'aws-cdk-lib/aws-s3';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";

import { createTracker } from './functions/createTracker/resource';
import { updateCurrentPosition } from './functions/updateCurrentPosition/resource';
import { sendNotification } from './functions/sendNotification/resource';
import { handleTrackerAllocation } from './functions/handleTrackerAllocation/resource';
import { postConfirmation } from './functions/postConfirmation/resource';
import { getEnvironmentConfig } from './env';

// Get environment configuration
const config = getEnvironmentConfig();

// Define table names
const TRACKER_DATA_TABLE = 'TrackerDataTable';
const USER_DATA_TABLE = 'UserDataTable';

// Initialize backend structure
const backend = defineBackend({
  auth,
  data,
  createTrackerFunction: createTracker,
  updateCurrentPositionFunction: updateCurrentPosition,
  sendNotificationFunction: sendNotification,
  handleTrackerAllocationFunction: handleTrackerAllocation,
  postConfirmationFunction: postConfirmation
});

// Create API stack
const apiStack = backend.createStack(`api-stack-${config.resourceSuffix}`);

// Create REST API
const api = new RestApi(apiStack, "RestApi", {
  restApiName: `allocationApi-${config.resourceSuffix}`,
  deploy: true,
  deployOptions: {
    stageName: config.resourceSuffix,
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: Cors.DEFAULT_HEADERS,
  },
});

// Create Lambda integration
const trackerAllocationIntegration = new LambdaIntegration(
  backend.handleTrackerAllocationFunction.resources.lambda
);

// Create Cognito authorizer
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, `CognitoAuth-${config.resourceSuffix}`, {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// Add API endpoints
const allocateTrackerPath = api.root.addResource("allocateTracker");
allocateTrackerPath.addMethod("POST", trackerAllocationIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// Add API policy
const apiPolicy = new Policy(apiStack, `RestApiPolicy-${config.resourceSuffix}`, {
  policyName: `rest-api-policy-${config.resourceSuffix}`,
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${api.arnForExecuteApi("*", "/allocateTracker", config.resourceSuffix)}`,
      ],
    }),
  ],
});

// Attach policies
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiPolicy);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(apiPolicy);

// Add API outputs
backend.addOutput({
  custom: {
    API: {
      [api.restApiName]: {
        endpoint: api.url,
        region: Stack.of(api).region,
        apiName: api.restApiName,
      },
    },
  },
});

// Set Lambda environment variables
const setLambdaEnvironments = () => {
  const functions = [
    { fn: backend.createTrackerFunction, vars: { TRACKER_DATA_TABLE_NAME: TRACKER_DATA_TABLE } },
    { fn: backend.updateCurrentPositionFunction, vars: { TRACKER_DATA_TABLE_NAME: TRACKER_DATA_TABLE } },
    { fn: backend.sendNotificationFunction, vars: { 
      ADMIN_EMAIL_ADDRESS: config.email.admin,
      SENDER_EMAIL_ADDRESS: config.email.sender
    }},
    { fn: backend.handleTrackerAllocationFunction, vars: { USER_DATA_TABLE_NAME: USER_DATA_TABLE } },
    { fn: backend.postConfirmationFunction, vars: { USER_DATA_TABLE_NAME: USER_DATA_TABLE } }
  ];

  functions.forEach(({ fn, vars }) => {
    Object.entries(vars).forEach(([key, value]) => {
      fn.addEnvironment(key, value);
    });
    fn.addEnvironment('BRANCH_NAME', config.branch);
  });
};

setLambdaEnvironments();

// Create Geo stack
const geoStack = backend.createStack(`geo-stack-${config.resourceSuffix}`);

// Create location services resources
const map = new CfnMap(geoStack, "Map", {
  mapName: `myMap-${config.resourceSuffix}`,
  description: `Map for IoT Geo Location (${config.resourceSuffix})`,
  configuration: { style: "VectorEsriNavigation" },
  pricingPlan: "RequestBasedUsage",
  tags: [
    { key: "name", value: `myMap-${config.resourceSuffix}` },
    { key: "environment", value: config.resourceSuffix },
    { key: "branch", value: config.branch }
  ],
});

const geofenceCollection = new CfnGeofenceCollection(geoStack, "GeofenceCollection", {
  collectionName: `myGeofenceCollection-${config.resourceSuffix}`,
  pricingPlan: "RequestBasedUsage",
  tags: [
    { key: "name", value: `myGeofenceCollection-${config.resourceSuffix}` },
    { key: "environment", value: config.resourceSuffix },
    { key: "branch", value: config.branch }
  ],
});

const placeIndex = new CfnPlaceIndex(geoStack, "PlaceIndex", {
  indexName: `myPlaceIndex-${config.resourceSuffix}`,
  pricingPlan: "RequestBasedUsage",
  dataSource: "Esri",
  tags: [
    { key: "name", value: `myPlaceIndex-${config.resourceSuffix}` },
    { key: "environment", value: config.resourceSuffix },
    { key: "branch", value: config.branch }
  ],
});

// Add Geo outputs
backend.addOutput({
  geo: {
    aws_region: Stack.of(map).region,
    maps: {
      items: {
        [map.mapName]: {
          style: "VectorEsriNavigation"
        }
      },
      default: map.mapName
    },
    geofence_collections: {
      default: geofenceCollection.collectionName,
      items: [geofenceCollection.collectionName]
    }
  }
});

// Add Geo permissions to authenticated role
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  new Policy(apiStack, `GeoPolicy-${config.resourceSuffix}`, {
    policyName: `geo-policy-${config.resourceSuffix}`,
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'geo:ListGeofences',
          'geo:PutGeofence',
          'geo:BatchDeleteGeofence',
          'geo:GetGeofence',
          'geo:UpdateGeofence'
        ],
        resources: [
          `arn:aws:geo:${Stack.of(map).region}:${Stack.of(map).account}:geofence-collection/${geofenceCollection.collectionName}`
        ]
      })
    ]
  })
);
