export interface AllocationEvent {
    body: string;
    requestContext?: {
        authorizer?: {
            claims?: {
                email?: string;
                [key: string]: string | undefined;
            };
        };
    };
}

export interface AllocationRequestBody {
    deviceId: string;
    userId: string;
    operation: 'ALLOCATE' | 'DEALLOCATE';
} 