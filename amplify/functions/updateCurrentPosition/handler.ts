import { LocationClient, BatchUpdateDevicePositionCommand } from "@aws-sdk/client-location";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// Global type declarations for Node.js environment
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            AWS_REGION: string;
            TRACKER_DATA_TABLE_NAME: string;
        }
    }
}

// Type definitions
interface IoTEvent {
    deviceId: string;
    latitude?: number;
    longitude?: number;
}

interface PositionUpdate {
    deviceId: string;
    latitude: number;
    longitude: number;
}

// Environment validation
const validateEnvironment = () => {
    const requiredEnvVars = ['AWS_REGION', 'TRACKER_DATA_TABLE_NAME'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }
};

// Initialize AWS clients
const initializeClients = () => {
    const region = process.env.AWS_REGION!;
    return {
        locationClient: new LocationClient({ region }),
        ddbClient: new DynamoDBClient({ region }),
        ddbDocClient: DynamoDBDocumentClient.from(new DynamoDBClient({ region }))
    };
};

// Validate event data
const validateEvent = (event: IoTEvent): PositionUpdate => {
    const { deviceId, latitude, longitude } = event;
    
    if (!deviceId) {
        throw new Error("deviceId is required in the IoT event");
    }
    
    if (latitude === undefined || longitude === undefined) {
        throw new Error("latitude and longitude are required in the IoT event");
    }
    
    return { deviceId, latitude, longitude };
};

// Main handler function
export const handler = async (event: IoTEvent): Promise<void> => {
    console.log('Received IoT event:', JSON.stringify(event, null, 2));

    try {
        // Validate environment variables
        validateEnvironment();

        // Validate and extract event data
        const { deviceId, latitude, longitude } = validateEvent(event);

        // Initialize clients
        const { locationClient, ddbDocClient } = initializeClients();
        const trackerName = `tracker-${deviceId}`;
        const tableName = process.env.TRACKER_DATA_TABLE_NAME!;

        // Update position in Location Service
        await updateDevicePosition(locationClient, trackerName, deviceId, latitude, longitude);

        // Update position in DynamoDB
        await updateTrackerData(ddbDocClient, tableName, deviceId, latitude, longitude);

        console.log(`Successfully updated position for device: ${deviceId}`);
    } catch (error) {
        console.error("Error updating position:", error);
        throw error;
    }
};

// Helper functions
async function updateDevicePosition(
    client: LocationClient,
    trackerName: string,
    deviceId: string,
    latitude: number,
    longitude: number
): Promise<void> {
    console.log(`Updating position for tracker: ${trackerName}`);
    await client.send(new BatchUpdateDevicePositionCommand({
        TrackerName: trackerName,
        Updates: [
            {
                DeviceId: deviceId,
                Position: [longitude, latitude],
                SampleTime: new Date(),
            },
        ],
    }));
    console.log(`Position updated for tracker ${trackerName}.`);
}

async function updateTrackerData(
    client: DynamoDBDocumentClient,
    tableName: string,
    deviceId: string,
    latitude: number,
    longitude: number
): Promise<void> {
    console.log(`Updating item in ${tableName} for device: ${deviceId}`);
    await client.send(new UpdateCommand({
        TableName: tableName,
        Key: { deviceId },
        UpdateExpression: "SET currentPosition = :cp, #ts = :t",
        ExpressionAttributeNames: { "#ts": "timestamp" },
        ExpressionAttributeValues: {
            ":cp": `${latitude},${longitude}`,
            ":t": new Date().toISOString(),
        },
    }));
    console.log(`TrackerData for ${deviceId} updated.`);
}
