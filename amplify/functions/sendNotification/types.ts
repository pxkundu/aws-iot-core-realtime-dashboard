export interface GeofenceEvent {    detail: {        EventType: string;        DeviceId: string;        GeofenceId: string;        TrackerArn: string;        SampleTime: string;        Position: [number, number];    };    "detail-type": string;    source: string;    version: string;    id: string;    "time": string;    region: string;    resources: string[];    account: string;
}

export interface SendNotificationEvent {
    adminEmail?: string;
    subject: string;
    message: string;
    deviceId?: string;
    userId?: string;
    operation?: 'ALLOCATE' | 'DEALLOCATE';
} 