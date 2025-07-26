import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';

interface NotificationSystemProps {
  sourceEmail: string;
}

export class NotificationSystemConstruct extends Construct {
  public readonly topicArn: string;
  public readonly topic: sns.Topic;

  constructor(scope: Construct, id: string, props: NotificationSystemProps) {
    super(scope, id);

    // SNS Topic for notifications
    this.topic = new sns.Topic(this, 'NotificationTopic', {
      topicName: 'aws-iot-dashboard-notifications',
      displayName: 'AWS IoT Dashboard Notifications'
    });

    // Lambda function to process notifications and send emails
    const emailProcessor = new lambda.NodejsFunction(this, 'EmailProcessor', {
      entry: 'amplify/custom/NotificationSystem/emailProcessor.ts',
      environment: {
        SOURCE_EMAIL: props.sourceEmail
      },
      timeout: Duration.seconds(30),
      memorySize: 256
    });

    // Subscribe Lambda to SNS topic
    this.topic.addSubscription(new subscriptions.LambdaSubscription(emailProcessor));

    // Grant SES permissions to Lambda
    emailProcessor.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*']
    }));

    // Grant SNS permissions to Lambda
    emailProcessor.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sns:GetTopicAttributes', 'sns:Subscribe', 'sns:Unsubscribe'],
      resources: [this.topic.topicArn]
    }));

    this.topicArn = this.topic.topicArn;
  }
} 