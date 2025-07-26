import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { LocationClient, BatchEvaluateGeofencesCommand } from '@aws-sdk/client-location';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import type { Handler } from 'aws-lambda';

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
const locationClient = new LocationClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

interface DeviceLocationEvent {
  deviceId: string;
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface GeofenceAssignment {
  PK: string;
  SK: string;
  deviceId: string;
  geofenceId: string;
  userId: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export const handler: Handler<DeviceLocationEvent> = async (event) => {
  console.log('Processing device location event:', JSON.stringify(event, null, 2));

  try {
    const { deviceId, userId, latitude, longitude, timestamp } = event;

    // Update device location in DynamoDB
    await updateDeviceLocation(deviceId, userId, latitude, longitude, timestamp);

    // Get active geofence assignments for this device
    const assignments = await getDeviceGeofenceAssignments(deviceId, userId);

    if (assignments.length > 0) {
      // Evaluate geofence status
      await evaluateGeofences(deviceId, userId, latitude, longitude, assignments);
    }

    console.log(`Successfully processed location update for device ${deviceId}`);
  } catch (error) {
    console.error('Error processing device location:', error);
    throw error;
  }
};

const updateDeviceLocation = async (deviceId: string, userId: string, latitude: number, longitude: number, timestamp: string) => {
  const locationData = {
    latitude,
    longitude,
    timestamp
  };

  await dynamoClient.send(new PutCommand({
    TableName: process.env.DEVICES_TABLE_NAME,
    Item: {
      PK: `USER#${userId}`,
      SK: `DEVICE#${deviceId}`,
      lastLocation: JSON.stringify(locationData),
      updatedAt: new Date().toISOString()
    }
  }));
};

const getDeviceGeofenceAssignments = async (deviceId: string, userId: string): Promise<GeofenceAssignment[]> => {
  const result = await dynamoClient.send(new QueryCommand({
    TableName: process.env.ASSIGNMENTS_TABLE_NAME,
    IndexName: 'DeviceIndex',
    KeyConditionExpression: 'deviceId = :deviceId',
    FilterExpression: 'userId = :userId AND #status = :status',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':deviceId': deviceId,
      ':userId': userId,
      ':status': 'ACTIVE'
    }
  }));

  return result.Items as GeofenceAssignment[] || [];
};

const evaluateGeofences = async (
  deviceId: string, 
  userId: string, 
  latitude: number, 
  longitude: number, 
  assignments: GeofenceAssignment[]
) => {
  // Prepare device position updates for geofence evaluation
  const devicePositionUpdates = assignments.map(assignment => ({
    DeviceId: deviceId,
    Position: [longitude, latitude], // Location Service expects [longitude, latitude]
    SampleTime: new Date()
  }));

  try {
    const geofenceResult = await locationClient.send(new BatchEvaluateGeofencesCommand({
      CollectionName: process.env.GEOFENCE_COLLECTION_NAME,
      DevicePositionUpdates: devicePositionUpdates
    }));

    // Check for geofence evaluation results
    if (geofenceResult.Errors && geofenceResult.Errors.length > 0) {
      for (const error of geofenceResult.Errors) {
        console.log(`Geofence evaluation error: ${error.Error?.Code} - ${error.Error?.Message}`);
      }
    }

    // For now, we'll use a simpler approach - check if device is outside any assigned geofence
    // This is a simplified implementation - in production, you'd want more sophisticated geofence evaluation
    console.log(`Device ${deviceId} location evaluated against ${assignments.length} geofences`);
    
    // Send a test notification for now (you can enhance this logic)
    if (assignments.length > 0) {
      // This is a placeholder - in real implementation, you'd check actual geofence boundaries
      console.log(`Device ${deviceId} has ${assignments.length} active geofence assignments`);
    }

  } catch (error) {
    console.error('Error evaluating geofences:', error);
    throw error;
  }
};

const sendGeofenceBreachNotification = async (deviceId: string, geofenceId: string, userId: string) => {
  const notificationMessage = {
    type: 'GEOFENCE_BREACH' as const,
    deviceId,
    geofenceId,
    userId,
    message: `Device ${deviceId} has breached geofence ${geofenceId}`,
    timestamp: new Date().toISOString()
  };

  try {
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
      Message: JSON.stringify(notificationMessage)
    }));

    console.log(`Geofence breach notification sent for device ${deviceId} and geofence ${geofenceId}`);
  } catch (error) {
    console.error('Error sending geofence breach notification:', error);
    throw error;
  }
}; 