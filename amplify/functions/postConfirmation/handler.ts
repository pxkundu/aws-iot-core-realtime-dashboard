import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";

// Global type declarations for Node.js environment
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            USER_DATA_TABLE_NAME: string;
        }
    }
}

// Type definitions
interface PostConfirmationEvent {
    userName: string;
    request: {
        userAttributes: {
            email: string;
        };
    };
    userPoolId: string;
}

interface UserData {
    userId: string;
    email: string;
    managedDevices: string[];
}

// Environment validation
const validateEnvironment = () => {
    const requiredEnvVars = ['USER_DATA_TABLE_NAME'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }
};

// Initialize AWS clients
const initializeClients = () => {
    return {
        ddbClient: new DynamoDBClient({}),
        cognitoClient: new CognitoIdentityProviderClient({})
    };
};

// Initialize user data in DynamoDB
const initializeUserData = async (
    ddbDocClient: DynamoDBDocumentClient,
    tableName: string,
    userData: UserData
): Promise<void> => {
    console.log(`Initializing UserData for user: ${userData.userId}`);
    await ddbDocClient.send(new PutCommand({
        TableName: tableName,
        Item: userData
    }));
    console.log(`UserData for ${userData.userId} initialized successfully`);
};

// Add user to Cognito group
const addUserToGroup = async (
    cognitoClient: CognitoIdentityProviderClient,
    userPoolId: string,
    userId: string,
    groupName: string
): Promise<void> => {
    console.log(`Adding user ${userId} to ${groupName} group in User Pool ${userPoolId}`);
    await cognitoClient.send(new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: userId,
        GroupName: groupName
    }));
    console.log(`User ${userId} added to ${groupName} group successfully`);
};

// Main handler function
export const handler = async (event: PostConfirmationEvent): Promise<PostConfirmationEvent> => {
    console.log('Received Post Confirmation event:', JSON.stringify(event, null, 2));

    try {
        // Validate environment variables
        validateEnvironment();

        // Initialize clients
        const { ddbClient, cognitoClient } = initializeClients();
        const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

        const { userName: userId, request: { userAttributes: { email } }, userPoolId } = event;
        const userDataTableName = process.env.USER_DATA_TABLE_NAME!;

        // Initialize user data
        await initializeUserData(ddbDocClient, userDataTableName, {
            userId,
            email,
            managedDevices: []
        });

        // Add user to Admins group
        await addUserToGroup(cognitoClient, userPoolId, userId, 'Admins');

        return event;
    } catch (error) {
        console.error("Error in PostConfirmation Lambda:", error);
        throw error;
    }
}; 