import { LocationClient, PutGeofenceCommand, BatchDeleteGeofenceCommand, ListGeofencesCommand } from '@aws-sdk/client-location';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const locationClient = new LocationClient({ region: 'eu-west-1' });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-1' }));

interface GeofenceData {
  name: string;
  geometry: {
    Polygon: number[][][];
  };
  description?: string;
}

interface GeofenceAssignment {
  deviceId: string;
  geofenceId: string;
  userId: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export class GeofenceService {
  private readonly collectionName = 'aws-iot-dashboard-dev-geofences'; // Existing resource
  private readonly assignmentsTableName = 'aws-iot-dashboard-assignments';

  async createGeofence(userId: string, geofenceData: GeofenceData): Promise<string> {
    const geofenceId = `${userId}-${Date.now()}`;

    try {
      // Create geofence in AWS Location Service
      await locationClient.send(new PutGeofenceCommand({
        CollectionName: this.collectionName,
        GeofenceId: geofenceId,
        Geometry: geofenceData.geometry
      }));

      // Store geofence metadata in DynamoDB
      await dynamoClient.send(new PutCommand({
        TableName: this.assignmentsTableName,
        Item: {
          PK: `USER#${userId}`,
          SK: `GEOFENCE#${geofenceId}`,
          geofenceId,
          geofenceName: geofenceData.name,
          description: geofenceData.description,
          geometry: JSON.stringify(geofenceData.geometry),
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          userId
        }
      }));

      console.log(`Geofence created successfully: ${geofenceId}`);
      return geofenceId;
    } catch (error) {
      console.error('Error creating geofence:', error);
      throw error;
    }
  }

  async assignDeviceToGeofence(userId: string, deviceId: string, geofenceId: string): Promise<void> {
    try {
      await dynamoClient.send(new PutCommand({
        TableName: this.assignmentsTableName,
        Item: {
          PK: `USER#${userId}`,
          SK: `ASSIGNMENT#${deviceId}#${geofenceId}`,
          deviceId,
          geofenceId,
          userId,
          status: 'ACTIVE',
          assignedAt: new Date().toISOString()
        }
      }));

      console.log(`Device ${deviceId} assigned to geofence ${geofenceId}`);
    } catch (error) {
      console.error('Error assigning device to geofence:', error);
      throw error;
    }
  }

  async getUserGeofences(userId: string): Promise<any[]> {
    try {
      const result = await dynamoClient.send(new QueryCommand({
        TableName: this.assignmentsTableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'GEOFENCE#'
        }
      }));

      return result.Items || [];
    } catch (error) {
      console.error('Error getting user geofences:', error);
      throw error;
    }
  }

  async getDeviceGeofenceAssignments(userId: string, deviceId: string): Promise<GeofenceAssignment[]> {
    try {
      const result = await dynamoClient.send(new QueryCommand({
        TableName: this.assignmentsTableName,
        IndexName: 'DeviceIndex',
        KeyConditionExpression: 'deviceId = :deviceId',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':deviceId': deviceId,
          ':userId': userId
        }
      }));

      return result.Items as GeofenceAssignment[] || [];
    } catch (error) {
      console.error('Error getting device geofence assignments:', error);
      throw error;
    }
  }

  async deleteGeofence(userId: string, geofenceId: string): Promise<void> {
    try {
      // Delete from AWS Location Service
      await locationClient.send(new BatchDeleteGeofenceCommand({
        CollectionName: this.collectionName,
        GeofenceIds: [geofenceId]
      }));

      // Delete from DynamoDB
      await dynamoClient.send(new DeleteCommand({
        TableName: this.assignmentsTableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `GEOFENCE#${geofenceId}`
        }
      }));

      console.log(`Geofence deleted successfully: ${geofenceId}`);
    } catch (error) {
      console.error('Error deleting geofence:', error);
      throw error;
    }
  }
} 