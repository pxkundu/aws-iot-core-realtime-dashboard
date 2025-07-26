import { DeviceService } from '../deviceService';

// Mock AWS SDK
jest.mock('@aws-sdk/client-location');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

describe('DeviceService', () => {
  let deviceService: DeviceService;
  const mockUserId = 'test-user-123';
  const mockDeviceData = {
    deviceId: 'device-123',
    name: 'Test Device',
    description: 'Test device description',
    latitude: 40.7128,
    longitude: -74.0060
  };

  beforeEach(() => {
    deviceService = new DeviceService();
    jest.clearAllMocks();
  });

  describe('createDevice', () => {
    it('should create a device successfully', async () => {
      // Mock DynamoDB PutCommand
      const mockPutCommand = jest.fn().mockResolvedValue({});
      const mockUpdateCommand = jest.fn().mockResolvedValue({});
      
      // Mock the DynamoDB client
      const mockDynamoClient = {
        send: jest.fn()
          .mockResolvedValueOnce({}) // For PutCommand
          .mockResolvedValueOnce({}) // For UpdateCommand
      };

      // Mock the Location client
      const mockLocationClient = {
        send: jest.fn().mockResolvedValue({})
      };

      // Replace the actual clients with mocks
      (deviceService as any).dynamoClient = mockDynamoClient;
      (deviceService as any).locationClient = mockLocationClient;

      await deviceService.createDevice(mockUserId, mockDeviceData);

      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'aws-iot-dashboard-devices',
            Item: expect.objectContaining({
              PK: `USER#${mockUserId}`,
              SK: `DEVICE#${mockDeviceData.deviceId}`,
              deviceId: mockDeviceData.deviceId,
              deviceName: mockDeviceData.name,
              description: mockDeviceData.description,
              status: 'ACTIVE'
            })
          }
        })
      );
    });

    it('should handle errors during device creation', async () => {
      const mockDynamoClient = {
        send: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
      };

      (deviceService as any).dynamoClient = mockDynamoClient;

      await expect(deviceService.createDevice(mockUserId, mockDeviceData))
        .rejects.toThrow('DynamoDB error');
    });
  });

  describe('getUserDevices', () => {
    it('should return user devices successfully', async () => {
      const mockDevices = [
        {
          deviceId: 'device-1',
          deviceName: 'Device 1',
          status: 'ACTIVE'
        },
        {
          deviceId: 'device-2',
          deviceName: 'Device 2',
          status: 'INACTIVE'
        }
      ];

      const mockDynamoClient = {
        send: jest.fn().mockResolvedValue({
          Items: mockDevices
        })
      };

      (deviceService as any).dynamoClient = mockDynamoClient;

      const result = await deviceService.getUserDevices(mockUserId);

      expect(result).toEqual(mockDevices);
      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'aws-iot-dashboard-devices',
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
              ':pk': `USER#${mockUserId}`,
              ':sk': 'DEVICE#'
            }
          }
        })
      );
    });

    it('should return empty array when no devices found', async () => {
      const mockDynamoClient = {
        send: jest.fn().mockResolvedValue({
          Items: []
        })
      };

      (deviceService as any).dynamoClient = mockDynamoClient;

      const result = await deviceService.getUserDevices(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('updateDeviceStatus', () => {
    it('should update device status successfully', async () => {
      const mockDynamoClient = {
        send: jest.fn().mockResolvedValue({})
      };

      (deviceService as any).dynamoClient = mockDynamoClient;

      await deviceService.updateDeviceStatus(mockUserId, 'device-123', 'INACTIVE');

      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'aws-iot-dashboard-devices',
            Key: {
              PK: `USER#${mockUserId}`,
              SK: 'DEVICE#device-123'
            },
            UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
              '#status': 'status'
            },
            ExpressionAttributeValues: {
              ':status': 'INACTIVE',
              ':updatedAt': expect.any(String)
            }
          }
        })
      );
    });
  });

  describe('deleteDevice', () => {
    it('should deactivate device instead of deleting', async () => {
      const mockUpdateDeviceStatus = jest.spyOn(deviceService, 'updateDeviceStatus')
        .mockResolvedValue();

      await deviceService.deleteDevice(mockUserId, 'device-123');

      expect(mockUpdateDeviceStatus).toHaveBeenCalledWith(mockUserId, 'device-123', 'INACTIVE');
    });
  });
}); 