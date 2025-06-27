import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Type definitions
interface GeofenceEvent {
    'detail-type': 'Location Geofence Event';
    detail: {
        DeviceId: string;
        EventType: 'EXIT' | 'ENTER';
        GeofenceId: string;
        SampleTime: string;
        Position: [number, number];
    };
}

interface SendNotificationEvent {
    adminEmail: string;
    subject: string;
    message: string;
}

interface EmailNotification {
    recipientEmail: string;
    subject: string;
    body: string;
}

// Environment validation
const validateEnvironment = () => {
    const requiredEnvVars = ['AWS_REGION', 'SENDER_EMAIL_ADDRESS'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }
};

// Initialize AWS clients
const initializeClients = () => {
    const region = process.env.AWS_REGION!;
    return {
        sesClient: new SESClient({ region })
    };
};

// Process different event types
const processEvent = (event: GeofenceEvent | SendNotificationEvent): EmailNotification | null => {
    if ('detail' in event && event['detail-type'] === 'Location Geofence Event') {
        return processGeofenceEvent(event as GeofenceEvent);
    } else if ('subject' in event && 'message' in event) {
        return processNotificationEvent(event as SendNotificationEvent);
    }
    throw new Error("Unknown event type received");
};

// Process Geofence event
const processGeofenceEvent = (event: GeofenceEvent): EmailNotification | null => {
    const { DeviceId, EventType, GeofenceId, SampleTime, Position } = event.detail;
    const recipientEmail = process.env.ADMIN_EMAIL_ADDRESS;

    if (EventType !== 'EXIT') {
        console.log(`Event type ${EventType} is not an EXIT event. No notification sent.`);
        return null;
    }

    if (!recipientEmail) {
        throw new Error("ADMIN_EMAIL_ADDRESS environment variable is not set");
    }

    return {
        recipientEmail,
        subject: `Tracker ${DeviceId} exited geofence ${GeofenceId}`,
        body: `Tracker ${DeviceId} exited geofence ${GeofenceId} at ${SampleTime}.\nLast known position: Lat ${Position[1]}, Lon ${Position[0]}`
    };
};

// Process Notification event
const processNotificationEvent = (event: SendNotificationEvent): EmailNotification => {
    if (!event.adminEmail) {
        throw new Error("Recipient email is required in notification event");
    }

    return {
        recipientEmail: event.adminEmail,
        subject: event.subject,
        body: event.message
    };
};

// Send email notification
const sendEmailNotification = async (
    sesClient: SESClient,
    notification: EmailNotification,
    senderEmail: string
): Promise<void> => {
    console.log(`Sending notification to ${notification.recipientEmail} with subject: "${notification.subject}"`);
    
    await sesClient.send(new SendEmailCommand({
        Destination: { ToAddresses: [notification.recipientEmail] },
        Message: {
            Body: { Text: { Data: notification.body } },
            Subject: { Data: notification.subject },
        },
        Source: senderEmail,
    }));
    
    console.log("Notification sent successfully");
};

// Main handler function
export const handler = async (event: GeofenceEvent | SendNotificationEvent): Promise<void> => {
    console.log('Received notification event:', JSON.stringify(event, null, 2));

    try {
        // Validate environment variables
        validateEnvironment();

        // Initialize clients
        const { sesClient } = initializeClients();
        const senderEmail = process.env.SENDER_EMAIL_ADDRESS!;

        // Process event and get notification details
        const notification = processEvent(event);
        if (!notification) {
            return;
        }

        // Send email notification
        await sendEmailNotification(sesClient, notification, senderEmail);
    } catch (error) {
        console.error("Error processing notification:", error);
        throw error;
    }
}; 