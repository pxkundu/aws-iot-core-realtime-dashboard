import * as iot from 'aws-cdk-lib/aws-iot';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';

interface DeviceManagementProps {
  environment: string;
  notificationTopicArn: string;
  devicesTableName: string;
  assignmentsTableName: string;
}

export class DeviceManagementConstruct extends Construct {
  public readonly iotEndpoint: string;
  public readonly iotPolicy: iot.CfnPolicy;

  constructor(scope: Construct, id: string, props: DeviceManagementProps) {
    super(scope, id);

    // IoT Policy for device connections
    this.iotPolicy = new iot.CfnPolicy(this, 'IoTPolicy', {
      policyName: `aws-iot-dashboard-${props.environment}-policy`,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'iot:Connect',
              'iot:Publish',
              'iot:Subscribe',
              'iot:Receive',
              'iot:GetThingShadow',
              'iot:UpdateThingShadow'
            ],
            Resource: '*'
          }
        ]
      }
    });

    // Lambda function for device location processing
    const deviceLocationProcessor = new lambda.NodejsFunction(this, 'DeviceLocationProcessor', {
      entry: 'amplify/custom/DeviceManagement/deviceLocationProcessor.ts',
      environment: {
        NOTIFICATION_TOPIC_ARN: props.notificationTopicArn,
        DEVICES_TABLE_NAME: props.devicesTableName,
        ASSIGNMENTS_TABLE_NAME: props.assignmentsTableName,
        GEOFENCE_COLLECTION_NAME: 'aws-iot-dashboard-dev-geofences' // Existing resource
      },
      timeout: Duration.seconds(30),
      memorySize: 512
    });

    // Grant DynamoDB permissions
    deviceLocationProcessor.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:Query',
        'dynamodb:Scan'
      ],
      resources: [
        `arn:aws:dynamodb:*:*:table/${props.devicesTableName}`,
        `arn:aws:dynamodb:*:*:table/${props.devicesTableName}/index/*`,
        `arn:aws:dynamodb:*:*:table/${props.assignmentsTableName}`,
        `arn:aws:dynamodb:*:*:table/${props.assignmentsTableName}/index/*`
      ]
    }));

    // Grant Location Service permissions
    deviceLocationProcessor.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'geo:BatchEvaluateGeofences',
        'geo:GetGeofence',
        'geo:ListGeofences'
      ],
      resources: ['*']
    }));

    // Grant SNS permissions
    deviceLocationProcessor.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: [props.notificationTopicArn]
    }));

    // Get IoT endpoint
    this.iotEndpoint = `${process.env.CDK_DEFAULT_ACCOUNT || '866934333672'}-ats.iot.${process.env.CDK_DEFAULT_REGION || 'eu-west-1'}.amazonaws.com`;
  }
} 