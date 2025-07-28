/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { useState, useEffect, useCallback } from 'react';
import { iotService, type LocationUpdate, type GeofenceEvent } from '@demo/services/iotService';

/**
 * React hook for IoT functionality
 * Provides real-time device tracking and geofence monitoring
 */
export const useIoTReal = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [locationUpdates, setLocationUpdates] = useState<LocationUpdate[]>([]);
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize IoT service
  const initializeIoT = useCallback(async () => {
    if (isInitializing) return;
    
    setIsInitializing(true);
    try {
      const success = await iotService.initialize();
      setIsConnected(success);
      
      if (success) {
        console.log('✅ IoT service initialized successfully');
      } else {
        console.error('❌ Failed to initialize IoT service');
      }
    } catch (error) {
      console.error('❌ IoT initialization error:', error);
      setIsConnected(false);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing]);

  // Subscribe to location updates for a device
  const subscribeToDevice = useCallback(async (deviceId: string) => {
    if (!isConnected) {
      console.warn('⚠️ IoT service not connected. Cannot subscribe to device:', deviceId);
      return () => {};
    }

    return await iotService.subscribeToLocationUpdates(deviceId, (update) => {
      setLocationUpdates(prev => {
        const filtered = prev.filter(u => u.deviceId !== update.deviceId);
        return [...filtered, update].slice(-50); // Keep last 50 updates
      });
    });
  }, [isConnected]);

  // Subscribe to geofence events
  const subscribeToGeofences = useCallback(async () => {
    if (!isConnected) {
      console.warn('⚠️ IoT service not connected. Cannot subscribe to geofences');
      return () => {};
    }

    return await iotService.subscribeToGeofenceEvents((event) => {
      setGeofenceEvents(prev => [...prev, event].slice(-20)); // Keep last 20 events
    });
  }, [isConnected]);

  // Update device location
  const updateDeviceLocation = useCallback(async (update: LocationUpdate) => {
    if (!isConnected) {
      console.warn('⚠️ IoT service not connected. Cannot update location');
      return false;
    }

    return await iotService.updateDeviceLocation(update);
  }, [isConnected]);

  // Get device location
  const getDeviceLocation = useCallback(async (deviceId: string) => {
    if (!isConnected) {
      console.warn('⚠️ IoT service not connected. Cannot get location');
      return null;
    }

    return await iotService.getDeviceLocation(deviceId);
  }, [isConnected]);

  // Start device simulation
  const startDeviceSimulation = useCallback((deviceId: string) => {
    if (!isConnected) {
      console.warn('⚠️ IoT service not connected. Cannot start simulation');
      return () => {};
    }

    return iotService.startDeviceSimulation(deviceId);
  }, [isConnected]);

  // Get latest location for a specific device
  const getLatestLocation = useCallback((deviceId: string): LocationUpdate | null => {
    return locationUpdates.find(update => update.deviceId === deviceId) || null;
  }, [locationUpdates]);

  // Get latest geofence event for a device
  const getLatestGeofenceEvent = useCallback((deviceId: string): GeofenceEvent | null => {
    return geofenceEvents
      .filter(event => event.deviceId === deviceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] || null;
  }, [geofenceEvents]);

  // Clear event history
  const clearLocationHistory = useCallback(() => {
    setLocationUpdates([]);
  }, []);

  const clearGeofenceHistory = useCallback(() => {
    setGeofenceEvents([]);
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    initializeIoT();
  }, [initializeIoT]);

  return {
    // Connection state
    isConnected,
    isInitializing,
    
    // Data
    locationUpdates,
    geofenceEvents,
    
    // Actions
    initializeIoT,
    subscribeToDevice,
    subscribeToGeofences,
    updateDeviceLocation,
    getDeviceLocation,
    startDeviceSimulation,
    
    // Utilities
    getLatestLocation,
    getLatestGeofenceEvent,
    clearLocationHistory,
    clearGeofenceHistory,
  };
}; 