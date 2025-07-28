// Real-time service for IoT and WebSocket connections

export interface LocationUpdate {
  deviceId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface GeofenceEvent {
  deviceId: string;
  geofenceId: string;
  eventType: 'ENTER' | 'EXIT';
  timestamp: string;
}

export class RealtimeService {
  private connection: any = null;
  private subscribers: Map<string, Function[]> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second

  // Connect to IoT Core for real-time updates
  async connect(): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement IoT Core WebSocket connection
      // For now, simulate connection
      console.log('Connecting to IoT Core...');
      
      // Simulate successful connection
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('Connected to IoT Core successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Failed to connect to IoT Core:', error);
      this.isConnected = false;
      
      // Attempt reconnection if under max attempts
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, this.reconnectDelay * this.reconnectAttempts); // Exponential backoff
      }
      
      return { success: false, error: error.message || 'Connection failed' };
    }
  }

  // Subscribe to device location updates
  subscribeToDeviceUpdates(deviceId: string, callback: (update: LocationUpdate) => void): void {
    if (!this.subscribers.has(deviceId)) {
      this.subscribers.set(deviceId, []);
    }
    this.subscribers.get(deviceId)!.push(callback);
    
    console.log(`Subscribed to updates for device: ${deviceId}`);
    
    // TODO: Subscribe to IoT Core topic for this device
    // Topic format: topic/device/{deviceId}/location
  }

  // Subscribe to geofence events
  subscribeToGeofenceEvents(callback: (event: GeofenceEvent) => void): void {
    if (!this.subscribers.has('geofence-events')) {
      this.subscribers.set('geofence-events', []);
    }
    this.subscribers.get('geofence-events')!.push(callback);
    
    console.log('Subscribed to geofence events');
    
    // TODO: Subscribe to Location Service geofence events
  }

  // Unsubscribe from device updates
  unsubscribeFromDeviceUpdates(deviceId: string, callback: Function): void {
    const callbacks = this.subscribers.get(deviceId);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        console.log(`Unsubscribed from updates for device: ${deviceId}`);
      }
      
      // Remove the subscription if no more callbacks
      if (callbacks.length === 0) {
        this.subscribers.delete(deviceId);
      }
    }
  }

  // Unsubscribe from geofence events
  unsubscribeFromGeofenceEvents(callback: Function): void {
    const callbacks = this.subscribers.get('geofence-events');
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        console.log('Unsubscribed from geofence events');
      }
    }
  }

  // Publish device location
  publishDeviceLocation(deviceId: string, location: { latitude: number; longitude: number }): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        if (!this.isConnected) {
          throw new Error('Not connected to IoT Core');
        }

        // TODO: Publish to IoT Core topic
        // Topic format: topic/device/{deviceId}/location
        const message = {
          deviceId,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString()
        };

        console.log(`Publishing location for device ${deviceId}:`, message);
        
        // Simulate successful publish
        resolve({ success: true });
      } catch (error: any) {
        console.error('Failed to publish device location:', error);
        resolve({ success: false, error: error.message });
      }
    });
  }

  // Simulate receiving a location update (for testing)
  simulateLocationUpdate(deviceId: string, latitude: number, longitude: number): void {
    const update: LocationUpdate = {
      deviceId,
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    };

    const callbacks = this.subscribers.get(deviceId);
    if (callbacks) {
      callbacks.forEach(callback => callback(update));
    }
  }

  // Simulate receiving a geofence event (for testing)
  simulateGeofenceEvent(deviceId: string, geofenceId: string, eventType: 'ENTER' | 'EXIT'): void {
    const event: GeofenceEvent = {
      deviceId,
      geofenceId,
      eventType,
      timestamp: new Date().toISOString()
    };

    const callbacks = this.subscribers.get('geofence-events');
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get active subscriptions count
  getActiveSubscriptions(): number {
    return Array.from(this.subscribers.values()).reduce((total, callbacks) => total + callbacks.length, 0);
  }

  // Disconnect and cleanup
  disconnect(): void {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    
    this.isConnected = false;
    this.subscribers.clear();
    this.reconnectAttempts = 0;
    
    console.log('Disconnected from IoT Core');
  }
}

// Export a singleton instance
export const realtimeService = new RealtimeService(); 