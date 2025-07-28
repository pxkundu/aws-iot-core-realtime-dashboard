import { Construct } from 'constructs';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as location from 'aws-cdk-lib/aws-location';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface IoTStackProps {
  environment: string;
  userPoolId?: string;
  identityPoolId?: string;
  dataSourceId?: string;
}

/**
 * Consolidated IoT Stack for Amplify Gen 2
 * Combines IoT Core, Location Service, and Notifications
 * @see https://docs.amplify.aws/gen2/build-a-backend/add-aws-services/
 */
export class IoTStack extends Construct {
  public readonly trackerName: string;
  public readonly geofenceCollectionName: string;
  public readonly notificationTopicArn: string;
  public readonly iotEndpoint: string;
  public readonly iotPolicy: iam.ManagedPolicy;

  constructor(scope: Construct, id: string, props: IoTStackProps) {
    super(scope, id);

    const stackRegion = Stack.of(this).region;
    const stackAccount = Stack.of(this).account;

    // ====================
    // IoT Core Resources
    // ====================
    
    const thingType = new iot.CfnThingType(this, 'DeviceThingType', {
      thingTypeName: `iot-dashboard-device-${props.environment}`
      // Removed thingTypeProperties - not needed for basic functionality
    });

    // IoT Policy for device connections
    const iotPolicy = new iot.CfnPolicy(this, 'IoTDevicePolicy', {
      policyName: `iot-dashboard-policy-${props.environment}`,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'iot:Connect',
              'iot:Publish',
              'iot:Subscribe',
              'iot:Receive'
            ],
            Resource: [
              `arn:aws:iot:${stackRegion}:${stackAccount}:client/\${cognito-identity.amazonaws.com:sub}`,
              `arn:aws:iot:${stackRegion}:${stackAccount}:topic/device/\${cognito-identity.amazonaws.com:sub}/*`,
              `arn:aws:iot:${stackRegion}:${stackAccount}:topicfilter/device/\${cognito-identity.amazonaws.com:sub}/*`
            ]
          }
        ]
      }
    });

    // ====================
    // Location Service Resources
    // ====================
    
    const tracker = new location.CfnTracker(this, 'LocationTracker', {
      trackerName: `iot-dashboard-tracker-${props.environment}`,
      description: 'Location tracker for IoT dashboard devices',
      positionFiltering: 'TimeBased'
    });

    const geofenceCollection = new location.CfnGeofenceCollection(this, 'GeofenceCollection', {
      collectionName: `iot-dashboard-geofences-${props.environment}`,
      description: 'Geofence collection for IoT dashboard'
    });

    // Create tracker consumer for geofence collection
    new location.CfnTrackerConsumer(this, 'TrackerConsumer', {
      trackerName: tracker.trackerName!,
      consumerArn: geofenceCollection.attrCollectionArn
    });

    // ====================
    // Notification Resources
    // ====================
    
    const notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      topicName: `iot-dashboard-notifications-${props.environment}`,
      displayName: 'IoT Dashboard Geofence Notifications'
    });

    // Email configuration
    const emailIdentity = new ses.EmailIdentity(this, 'EmailIdentity', {
      identity: ses.Identity.email('noreply@iot-dashboard.com') // Update with your domain
    });

    // ====================
    // Lambda Function for Event Processing
    // ====================
    
    const processorFunction = new lambda.Function(this, 'IoTEventProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const sns = new AWS.SNS();
        const ses = new AWS.SES();
        
        exports.handler = async (event) => {
          console.log('Processing IoT event:', JSON.stringify(event, null, 2));
          
          try {
            // Process geofence events
            if (event.source === 'aws.geo' && event['detail-type'] === 'Location Geofence Event') {
              const { deviceId, geofenceId, eventType } = event.detail;
              
              // Send SNS notification
              await sns.publish({
                TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
                Subject: \`Geofence Alert: Device \${deviceId}\`,
                Message: \`Device \${deviceId} has \${eventType.toLowerCase()}ed geofence \${geofenceId}\`
              }).promise();
              
              // Send email notification (if configured)
              const emailParams = {
                Source: 'noreply@iot-dashboard.com',
                Destination: {
                  ToAddresses: [process.env.ADMIN_EMAIL || 'admin@example.com']
                },
                Message: {
                  Subject: { Data: \`IoT Alert: \${eventType} Event\` },
                  Body: {
                    Text: { 
                      Data: \`Device \${deviceId} triggered a \${eventType} event for geofence \${geofenceId} at \${new Date().toISOString()}\`
                    }
                  }
                }
              };
              
              await ses.sendEmail(emailParams).promise();
            }
            
            return { statusCode: 200, body: 'Event processed successfully' };
          } catch (error) {
            console.error('Error processing event:', error);
            return { statusCode: 500, body: 'Error processing event' };
          }
        };
      `),
      environment: {
        NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
        TRACKER_NAME: tracker.trackerName!,
        GEOFENCE_COLLECTION_NAME: geofenceCollection.collectionName!,
        REGION: stackRegion
      }
    });

    // Grant permissions to Lambda
    notificationTopic.grantPublish(processorFunction);
    
    processorFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'geo:GetDevicePosition',
        'geo:BatchGetDevicePosition',
        'geo:GetGeofence',
        'geo:ListGeofences'
      ],
      resources: [
        tracker.attrTrackerArn,
        geofenceCollection.attrCollectionArn
      ]
    }));

    processorFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ses:SendEmail',
        'ses:SendRawEmail'
      ],
      resources: ['*']
    }));

    // ====================
    // IAM Role for Cognito Identity Pool
    // ====================
    
    this.iotPolicy = new iam.ManagedPolicy(this, 'IoTAccessPolicy', {
      // Fixed: Remove non-existent policyName property - CDK generates it automatically
      managedPolicyName: `iot-dashboard-access-${props.environment}`,
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'iot:Connect',
            'iot:Publish',
            'iot:Subscribe',
            'iot:Receive'
          ],
          resources: ['*'],
          conditions: {
            StringEquals: {
              'iot:Connection.Thing.IsAttachedToPolicy': 'true'
            }
          }
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'geo:GetDevicePosition',
            'geo:BatchGetDevicePosition',
            'geo:GetGeofence',
            'geo:ListGeofences',
            'geo:PutGeofence',
            'geo:BatchUpdateDevicePosition'
          ],
          resources: [
            tracker.attrTrackerArn,
            geofenceCollection.attrCollectionArn
          ]
        })
      ]
    });

    // ====================
    // EventBridge Rule for Geofence Events
    // ====================
    
    const eventRule = new lambda.CfnPermission(this, 'GeofenceEventPermission', {
      functionName: processorFunction.functionName,
      action: 'lambda:InvokeFunction',
      principal: 'events.amazonaws.com'
    });

    // Set public properties
    this.trackerName = tracker.trackerName!;
    this.geofenceCollectionName = geofenceCollection.collectionName!;
    this.notificationTopicArn = notificationTopic.topicArn;
    this.iotEndpoint = `https://iot.${stackRegion}.amazonaws.com`;

    // Outputs for debugging
    thingType.applyRemovalPolicy(RemovalPolicy.DESTROY);
    tracker.applyRemovalPolicy(RemovalPolicy.DESTROY);
    geofenceCollection.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
} 