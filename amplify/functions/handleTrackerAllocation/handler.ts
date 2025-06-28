import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

// Global type declarations for Node.js environment
declare const process: {
    env: {
        USER_DATA_TABLE_NAME: string;
        SEND_NOTIFICATION_FUNCTION_NAME: string;
        [key: string]: string | undefined;
    };
};

// Type definitions
interface AllocationEvent {
    requestContext?: {
        authorizer?: {
            claims?: {
                email?: string;
            };
        };
    };
    body?: string;
}

interface AllocationRequestBody {
    deviceId: string;
    userId: string;
    operation: 'ALLOCATE' | 'DEALLOCATE';
}

interface UserData {
    userId: string;
    managedDevices?: string[];
}

interface ApiResponse {
    statusCode: number;
    body: string;
}

// Environment validation
const validateEnvironment = () => {
    const requiredEnvVars = ['USER_DATA_TABLE_NAME', 'SEND_NOTIFICATION_FUNCTION_NAME'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }
};

// Initialize AWS clients
const initializeClients = () => {
    return {
        ddbClient: new DynamoDBClient({}),
        lambdaClient: new LambdaClient({})
    };
};

// Validate request body
const validateRequestBody = (body: string): AllocationRequestBody => {
    try {
        const requestBody = JSON.parse(body) as AllocationRequestBody;
        
        if (!requestBody.deviceId || !requestBody.userId || !requestBody.operation) {
            throw new Error("Missing required fields: deviceId, userId, or operation");
        }
        
        if (!['ALLOCATE', 'DEALLOCATE'].includes(requestBody.operation)) {
            throw new Error("Invalid operation. Must be ALLOCATE or DEALLOCATE");
        }
        
        return requestBody;
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error("Invalid JSON in request body");
        }
        throw error;
    }
};

// Get user data from DynamoDB
const getUserData = async (
    ddbDocClient: DynamoDBDocumentClient,
    tableName: string,
    userId: string
): Promise<UserData> => {
    const result = await ddbDocClient.send(new GetCommand({
        TableName: tableName,
        Key: { userId }
    }));

    if (!result.Item) {
        throw new Error(`User ${userId} not found`);
    }

    return result.Item as UserData;
};

// Update user's managed devices
const updateManagedDevices = async (
    ddbDocClient: DynamoDBDocumentClient,
    tableName: string,
    userId: string,
    managedDevices: string[]
): Promise<void> => {
    await ddbDocClient.send(new UpdateCommand({
        TableName: tableName,
        Key: { userId },
        UpdateExpression: "SET managedDevices = :md",
        ExpressionAttributeValues: {
            ":md": managedDevices
        }
    }));
};

// Send notification
const sendNotification = async (
    lambdaClient: LambdaClient,
    functionName: string,
    payload: {
        adminEmail?: string;
        subject: string;
        message: string;
        deviceId: string;
        userId: string;
        operation: string;
    }
): Promise<void> => {
    await lambdaClient.send(new InvokeCommand({
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify(payload)
    }));
};

// Process allocation operation
const processAllocation = (
    managedDevices: string[],
    deviceId: string,
    operation: 'ALLOCATE' | 'DEALLOCATE'
): { updatedDevices: string[]; message: string } => {
    const devices = [...managedDevices];
    let message = '';

    if (operation === 'ALLOCATE') {
        if (!devices.includes(deviceId)) {
            devices.push(deviceId);
            message = `Device ${deviceId} has been allocated to user.`;
        } else {
            message = `Device ${deviceId} was already allocated to user.`;
        }
    } else {
        const index = devices.indexOf(deviceId);
        if (index > -1) {
            devices.splice(index, 1);
            message = `Device ${deviceId} has been deallocated from user.`;
        } else {
            message = `Device ${deviceId} was not allocated to user.`;
        }
    }

    return { updatedDevices: devices, message };
};

// Main handler function
export const handler = async (event: AllocationEvent): Promise<ApiResponse> => {
    console.log('Received allocation event:', JSON.stringify(event, null, 2));

    try {
        // Validate environment variables
        validateEnvironment();

        // Initialize clients
        const { ddbClient, lambdaClient } = initializeClients();
        const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

        // Get admin email from event context
        const adminEmail = event.requestContext?.authorizer?.claims?.email;

        // Validate request body
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Request body is missing" })
            };
        }

        const { deviceId, userId, operation } = validateRequestBody(event.body);
        const userDataTableName = process.env.USER_DATA_TABLE_NAME!;
        const sendNotificationFunctionName = process.env.SEND_NOTIFICATION_FUNCTION_NAME!;

        // Get and update user data
        const user = await getUserData(ddbDocClient, userDataTableName, userId);
        const { updatedDevices, message } = processAllocation(
            user.managedDevices || [],
            deviceId,
            operation
        );

        // Update user data in DynamoDB
        await updateManagedDevices(ddbDocClient, userDataTableName, userId, updatedDevices);
        console.log(`UserData for ${userId} updated`);

        // Send notification
        await sendNotification(lambdaClient, sendNotificationFunctionName, {
            adminEmail,
            subject: `Tracker Allocation Update for Device ${deviceId}`,
            message,
            deviceId,
            userId,
            operation
        });
        console.log("Notification sent");

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Operation ${operation} successful for device ${deviceId} and user ${userId}` })
        };
    } catch (error) {
        console.error("Error handling tracker allocation:", error);
        
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: error.message })
                };
            }
            if (error.message.includes("Invalid") || error.message.includes("Missing")) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: error.message })
                };
            }
        }
        
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to process allocation request" })
        };
    }
}; 