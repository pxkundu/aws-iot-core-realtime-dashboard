import { LocationClient } from '@aws-sdk/client-location';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const locationClient = new LocationClient({ region: 'eu-west-1' });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-1' }));

interface DeviceData {
  deviceId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
}

interface DeviceLocation {
  deviceId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export class DeviceService {
  private readonly trackerName = 'aws-iot-dashboard-dev-tracker'; // Existing resource
  private readonly devicesTableName = 'aws-iot-dashboard-devices';

  async createDevice(userId: string, deviceData: DeviceData): Promise<void> {
    try {
      // Store device information in DynamoDB
      await dynamoClient.send(new PutCommand({
        TableName: this.devicesTableName,
        Item: {
          PK: `USER#${userId}`,
          SK: `DEVICE#${deviceData.deviceId}`,
          deviceId: deviceData.deviceId,
          deviceName: deviceData.name,
          description: deviceData.description,
          trackerName: this.trackerName,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          userId
        }
      }));

      // Update device position in Location Service tracker
      await this.updateDeviceLocation(deviceData.deviceId, deviceData.latitude, deviceData.longitude);

      console.log(`Device created successfully: ${deviceData.deviceId}`);
    } catch (error) {
      console.error('Error creating device:', error);
      throw error;
    }
  }

  async updateDeviceLocation(deviceId: string, latitude: number, longitude: number): Promise<void> {
    try {
      // For now, we'll use a simplified approach
      // In production, you'd use the actual Location Service API
      console.log(`Device location updated: ${deviceId} at [${latitude}, ${longitude}]`);
      
      // Update device location in DynamoDB
      await dynamoClient.send(new UpdateCommand({
        TableName: this.devicesTableName,
        Key: {
          PK: `USER#${deviceId.split('-')[0]}`, // Extract userId from deviceId
          SK: `DEVICE#${deviceId}`
        },
        UpdateExpression: 'SET lastLocation = :location, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':location': JSON.stringify({ latitude, longitude, timestamp: new Date().toISOString() }),
          ':updatedAt': new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error updating device location:', error);
      throw error;
    }
  }

  async getUserDevices(userId: string): Promise<any[]> {
    try {
      const result = await dynamoClient.send(new QueryCommand({
        TableName: this.devicesTableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'DEVICE#'
        }
      }));

      return result.Items || [];
    } catch (error) {
      console.error('Error getting user devices:', error);
      throw error;
    }
  }

  async getDevice(userId: string, deviceId: string): Promise<any> {
    try {
      const result = await dynamoClient.send(new QueryCommand({
        TableName: this.devicesTableName,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': `DEVICE#${deviceId}`
        }
      }));

      return result.Items?.[0] || null;
    } catch (error) {
      console.error('Error getting device:', error);
      throw error;
    }
  }

  async updateDeviceStatus(userId: string, deviceId: string, status: 'ACTIVE' | 'INACTIVE' | 'OFFLINE'): Promise<void> {
    try {
      await dynamoClient.send(new UpdateCommand({
        TableName: this.devicesTableName,
        Key: {
          PK: `USER#${userId}`,
          SK: `DEVICE#${deviceId}`
        },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': new Date().toISOString()
        }
      }));

      console.log(`Device status updated: ${deviceId} -> ${status}`);
    } catch (error) {
      console.error('Error updating device status:', error);
      throw error;
    }
  }

  async deleteDevice(userId: string, deviceId: string): Promise<void> {
    try {
      // Update device status to INACTIVE instead of deleting
      await this.updateDeviceStatus(userId, deviceId, 'INACTIVE');
      console.log(`Device deactivated: ${deviceId}`);
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
  }
} 