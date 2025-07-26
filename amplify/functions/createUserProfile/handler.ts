import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { PostConfirmationTriggerHandler } from 'aws-lambda';

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

export const handler: PostConfirmationTriggerHandler = async (event) => {
  console.log('Creating user profile for:', event.userName);

  try {
    const userId = event.userName;
    const userEmail = event.request.userAttributes.email;
    const userName = event.request.userAttributes.name || userEmail.split('@')[0];

    // Create user profile in DynamoDB
    await dynamoClient.send(new PutCommand({
      TableName: process.env.DEVICES_TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: `PROFILE#${userId}`,
        userId,
        email: userEmail,
        name: userName,
        createdAt: new Date().toISOString(),
        status: 'ACTIVE'
      }
    }));

    console.log(`User profile created successfully for ${userId}`);
    return event;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}; 