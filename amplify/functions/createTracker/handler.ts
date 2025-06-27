interface IoTEvent {
    deviceId: string;
    latitude?: number;
    longitude?: number;
}

interface TrackerData {
    deviceId: string;
    currentPosition: string | null;
    timestamp: string;
    geofenceCollectionId: string;
}

import { LocationClient, CreateGeofenceCollectionCommand, CreateTrackerCommand } from "@aws-sdk/client-location";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

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

// Main handler function
export const handler = async (event: IoTEvent): Promise<void> => {
    console.log('Received IoT event:', JSON.stringify(event, null, 2));

    // Validate environment variables
    validateEnvironment();

    const { deviceId, latitude, longitude } = event;
    if (!deviceId) {
        throw new Error("deviceId is required in the IoT event");
    }

    const { locationClient, ddbDocClient } = initializeClients();
    const geofenceCollectionName = `geofence-collection-${deviceId}`;
    const trackerName = `tracker-${deviceId}`;
    const tableName = process.env.TRACKER_DATA_TABLE_NAME!;

    try {
        // 1. Create Geofence Collection
        await createGeofenceCollection(locationClient, geofenceCollectionName);

        // 2. Create Tracker
        await createTracker(locationClient, trackerName);

        // 3. Initialize TrackerData in DynamoDB
        await initializeTrackerData(ddbDocClient, {
            deviceId,
            currentPosition: latitude && longitude ? `${latitude},${longitude}` : null,
            timestamp: new Date().toISOString(),
            geofenceCollectionId: geofenceCollectionName
        }, tableName);

        console.log(`Successfully initialized resources for device: ${deviceId}`);
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'ResourceAlreadyExistsException') {
                console.warn(`Resource already exists for device ${deviceId}. Skipping creation.`);
                return;
            }
            console.error("Error creating resources for device:", deviceId, error);
            throw error;
        }
        throw new Error('An unknown error occurred');
    }
};

// Helper functions
async function createGeofenceCollection(client: LocationClient, collectionName: string): Promise<void> {
    console.log(`Creating geofence collection: ${collectionName}`);
    await client.send(new CreateGeofenceCollectionCommand({
        CollectionName: collectionName,
        PricingPlan: 'RequestBasedUsage',
    }));
    console.log(`Geofence collection ${collectionName} created.`);
}

async function createTracker(client: LocationClient, trackerName: string): Promise<void> {
    console.log(`Creating tracker: ${trackerName}`);
    await client.send(new CreateTrackerCommand({
        TrackerName: trackerName,
        PricingPlan: 'RequestBasedUsage',
    }));
    console.log(`Tracker ${trackerName} created.`);
}

async function initializeTrackerData(
    client: DynamoDBDocumentClient,
    data: TrackerData,
    tableName: string
): Promise<void> {
    console.log(`Putting item into ${tableName} for device: ${data.deviceId}`);
    await client.send(new PutCommand({
        TableName: tableName,
        Item: data,
    }));
    console.log(`TrackerData for ${data.deviceId} initialized.`);
} 