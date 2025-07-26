import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { SNSHandler } from 'aws-lambda';

const sesClient = new SESClient({ region: process.env.AWS_REGION });

interface NotificationMessage {
  type: 'GEOFENCE_BREACH' | 'DEVICE_OFFLINE' | 'SYSTEM_ALERT';
  deviceId?: string;
  geofenceId?: string;
  userId: string;
  message: string;
  recipientEmail?: string;
}

export const handler: SNSHandler = async (event) => {
  console.log('Processing notification event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      const message: NotificationMessage = JSON.parse(record.Sns.Message);
      console.log('Processing message:', message);

      // Send email notification
      await sendEmail(message);
      
      console.log(`Email sent successfully for message type: ${message.type}`);
    } catch (error) {
      console.error('Error processing notification:', error);
      throw error;
    }
  }
};

const sendEmail = async (message: NotificationMessage) => {
  const { type, deviceId, geofenceId, message: notificationMessage, recipientEmail } = message;

  // Determine email subject and body based on notification type
  let subject: string;
  let body: string;

  switch (type) {
    case 'GEOFENCE_BREACH':
      subject = `🚨 Geofence Breach Alert - Device ${deviceId}`;
      body = `
Hello,

Your device ${deviceId} has breached the geofence ${geofenceId}.

Details:
- Device ID: ${deviceId}
- Geofence ID: ${geofenceId}
- Time: ${new Date().toISOString()}
- Message: ${notificationMessage}

Please check your device location and take appropriate action.

Best regards,
AWS IoT Dashboard Team
      `;
      break;

    case 'DEVICE_OFFLINE':
      subject = `⚠️ Device Offline Alert - Device ${deviceId}`;
      body = `
Hello,

Your device ${deviceId} has gone offline.

Details:
- Device ID: ${deviceId}
- Time: ${new Date().toISOString()}
- Message: ${notificationMessage}

Please check your device connectivity and ensure it's powered on.

Best regards,
AWS IoT Dashboard Team
      `;
      break;

    default:
      subject = `ℹ️ System Alert`;
      body = `
Hello,

You have received a system alert.

Details:
- Time: ${new Date().toISOString()}
- Message: ${notificationMessage}

Best regards,
AWS IoT Dashboard Team
      `;
  }

  const command = new SendEmailCommand({
    Source: process.env.SOURCE_EMAIL,
    Destination: {
      ToAddresses: [recipientEmail || 'admin@yourdomain.com'] // Default fallback
    },
    Message: {
      Body: {
        Text: { Data: body.trim() }
      },
      Subject: { Data: subject }
    }
  });

  try {
    const result = await sesClient.send(command);
    console.log(`Email sent successfully: ${result.MessageId}`);
    return result;
  } catch (error) {
    console.error(`Error sending email: ${error}`);
    throw error;
  }
}; 