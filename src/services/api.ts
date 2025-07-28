import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

/**
 * Amplify Gen 2 GraphQL Client
 * @see https://docs.amplify.aws/gen2/build-a-backend/data/connect-from-client/
 */
const client = generateClient<Schema>();

// Result interface for consistent API responses
export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ====================
// Tracker API Operations
// ====================

export const trackerAPI = {
  /**
   * List all trackers for the authenticated user
   */
  list: async (): Promise<ApiResult<Schema['Tracker']['type'][]>> => {
    try {
      const response = await client.models.Tracker.list();
      return {
        success: true,
        data: response.data || [] // Handle potential null data
      };
    } catch (error) {
      console.error('Error listing trackers:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to list trackers'
      };
    }
  },

  /**
   * Create a new tracker
   */
  create: async (tracker: {
    trackerId: string;
    name: string;
    description?: string;
    region: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'CREATING' | 'DELETING';
    eventFiltering?: any;
    kmsKeyId?: string;
    tags?: any;
  }): Promise<ApiResult<Schema['Tracker']['type'] | null>> => {
    try {
      const response = await client.models.Tracker.create({
        ...tracker,
        status: tracker.status || 'CREATING',
        createdAt: new Date().toISOString()
      });
      return {
        success: true,
        data: response.data // Can be null
      };
    } catch (error) {
      console.error('Error creating tracker:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to create tracker'
      };
    }
  },

  /**
   * Update an existing tracker
   */
  update: async (
    id: string, 
    updates: Partial<Schema['Tracker']['type']>
  ): Promise<ApiResult<Schema['Tracker']['type'] | null>> => {
    try {
      const response = await client.models.Tracker.update({
        id,
        ...updates,
        lastActivity: new Date().toISOString()
      });
      return {
        success: true,
        data: response.data // Can be null
      };
    } catch (error) {
      console.error('Error updating tracker:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to update tracker'
      };
    }
  },

  /**
   * Delete a tracker
   */
  delete: async (id: string): Promise<ApiResult> => {
    try {
      await client.models.Tracker.delete({ id });
      return { success: true };
    } catch (error) {
      console.error('Error deleting tracker:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to delete tracker'
      };
    }
  },

  /**
   * Get a single tracker by ID
   */
  get: async (id: string): Promise<ApiResult<Schema['Tracker']['type'] | null>> => {
    try {
      const response = await client.models.Tracker.get({ id });
      return {
        success: true,
        data: response.data // Can be null
      };
    } catch (error) {
      console.error('Error getting tracker:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to get tracker'
      };
    }
  },

  /**
   * Get tracker with devices
   */
  getWithDevices: async (id: string): Promise<ApiResult<Schema['Tracker']['type'] | null>> => {
    try {
      const response = await client.models.Tracker.get({ id });
      if (response.data) {
        // Fetch associated devices
        const devicesResponse = await client.models.Device.list({
          filter: { trackerName: { eq: response.data.trackerId } }
        });
        
        return {
          success: true,
          data: {
            ...response.data,
            devices: devicesResponse.data || []
          } as any
        };
      }
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting tracker with devices:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to get tracker with devices'
      };
    }
  }
};

// ====================
// Device API Operations
// ====================

export const deviceAPI = {
  /**
   * List all devices for the authenticated user
   */
  list: async (): Promise<ApiResult<Schema['Device']['type'][]>> => {
    try {
      const response = await client.models.Device.list();
      return {
        success: true,
        data: response.data || [] // Handle potential null data
      };
    } catch (error) {
      console.error('Error listing devices:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to list devices'
      };
    }
  },

  /**
   * Create a new device
   */
  create: async (device: {
    deviceId: string;
    name: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'OFFLINE';
    trackerName?: string;
  }): Promise<ApiResult<Schema['Device']['type'] | null>> => {
    try {
      const response = await client.models.Device.create({
        ...device,
        lastUpdated: new Date().toISOString()
      });
      return {
        success: true,
        data: response.data // Can be null
      };
    } catch (error) {
      console.error('Error creating device:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to create device'
      };
    }
  },

  /**
   * Update an existing device
   */
  update: async (
    id: string, 
    updates: Partial<Schema['Device']['type']>
  ): Promise<ApiResult<Schema['Device']['type'] | null>> => {
    try {
      const response = await client.models.Device.update({
        id,
        ...updates,
        lastUpdated: new Date().toISOString()
      });
      return {
        success: true,
        data: response.data // Can be null
      };
    } catch (error) {
      console.error('Error updating device:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to update device'
      };
    }
  },

  /**
   * Delete a device
   */
  delete: async (id: string): Promise<ApiResult> => {
    try {
      await client.models.Device.delete({ id });
      return { success: true };
    } catch (error) {
      console.error('Error deleting device:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to delete device'
      };
    }
  },

  /**
   * Get a single device by ID
   */
  get: async (id: string): Promise<ApiResult<Schema['Device']['type'] | null>> => {
    try {
      const response = await client.models.Device.get({ id });
      return {
        success: true,
        data: response.data // Can be null
      };
    } catch (error) {
      console.error('Error getting device:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to get device'
      };
    }
  }
};

// ====================
// Geofence API Operations
// ====================

export const geofenceAPI = {
  /**
   * List all geofences for the authenticated user
   */
  list: async (): Promise<ApiResult<Schema['Geofence']['type'][]>> => {
    try {
      const response = await client.models.Geofence.list();
      return {
        success: true,
        data: response.data || [] // Handle potential null data
      };
    } catch (error) {
      console.error('Error listing geofences:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to list geofences'
      };
    }
  },

  /**
   * Create a new geofence
   */
  create: async (geofence: {
    geofenceId: string;
    name: string;
    description?: string;
    geometry: string; // GeoJSON string
    status?: 'ACTIVE' | 'INACTIVE';
  }): Promise<ApiResult<Schema['Geofence']['type'] | null>> => {
    try {
      const response = await client.models.Geofence.create({
        ...geofence,
        status: geofence.status || 'ACTIVE'
      });
      return {
        success: true,
        data: response.data // Can be null
      };
    } catch (error) {
      console.error('Error creating geofence:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to create geofence'
      };
    }
  },

  /**
   * Update an existing geofence
   */
  update: async (
    id: string, 
    updates: Partial<Schema['Geofence']['type']>
  ): Promise<ApiResult<Schema['Geofence']['type'] | null>> => {
    try {
      const response = await client.models.Geofence.update({
        id,
        ...updates
      });
      return {
        success: true,
        data: response.data // Can be null
      };
    } catch (error) {
      console.error('Error updating geofence:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to update geofence'
      };
    }
  },

  /**
   * Delete a geofence
   */
  delete: async (id: string): Promise<ApiResult> => {
    try {
      await client.models.Geofence.delete({ id });
      return { success: true };
    } catch (error) {
      console.error('Error deleting geofence:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to delete geofence'
      };
    }
  },

  /**
   * Get a single geofence by ID
   */
  get: async (id: string): Promise<ApiResult<Schema['Geofence']['type'] | null>> => {
    try {
      const response = await client.models.Geofence.get({ id });
      return {
        success: true,
        data: response.data // Can be null
      };
    } catch (error) {
      console.error('Error getting geofence:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to get geofence'
      };
    }
  }
};

// ====================
// Assignment API Operations
// ====================

export const assignmentAPI = {
  /**
   * List all device assignments for the authenticated user
   */
  list: async (): Promise<ApiResult<Schema['DeviceAssignment']['type'][]>> => {
    try {
      const response = await client.models.DeviceAssignment.list();
      return {
        success: true,
        data: response.data || [] // Handle potential null data
      };
    } catch (error) {
      console.error('Error listing assignments:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to list assignments'
      };
    }
  },

  /**
   * Create a new device assignment
   */
  create: async (assignment: {
    deviceId: string;
    geofenceId: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }): Promise<ApiResult<Schema['DeviceAssignment']['type'] | null>> => {
    try {
      const response = await client.models.DeviceAssignment.create({
        ...assignment,
        status: assignment.status || 'ACTIVE',
        assignedAt: new Date().toISOString()
      });
      return {
        success: true,
        data: response.data // Can be null
      };
    } catch (error) {
      console.error('Error creating assignment:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to create assignment'
      };
    }
  },

  /**
   * Update an existing assignment
   */
  update: async (
    id: string, 
    updates: Partial<Schema['DeviceAssignment']['type']>
  ): Promise<ApiResult<Schema['DeviceAssignment']['type'] | null>> => {
    try {
      const response = await client.models.DeviceAssignment.update({
        id,
        ...updates
      });
      return {
        success: true,
        data: response.data // Can be null
      };
    } catch (error) {
      console.error('Error updating assignment:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to update assignment'
      };
    }
  },

  /**
   * Delete an assignment
   */
  delete: async (id: string): Promise<ApiResult> => {
    try {
      await client.models.DeviceAssignment.delete({ id });
      return { success: true };
    } catch (error) {
      console.error('Error deleting assignment:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to delete assignment'
      };
    }
  }
};

// Export the GraphQL client for advanced usage
export { client as graphqlClient }; 