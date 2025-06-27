export interface PostConfirmationEvent {
    version: string;
    region: string;
    userPoolId: string;
    userName: string;
    callerContext: {
        awsSdkVersion: string;
        clientId: string;
    };
    request: {
        userAttributes: {
            email: string;
            [key: string]: string;
        };
    };
    response: {};
} 