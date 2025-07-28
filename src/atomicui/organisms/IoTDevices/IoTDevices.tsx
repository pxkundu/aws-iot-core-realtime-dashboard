/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { FC, useState, useEffect, useCallback } from "react";
import { Flex, View, Button, TextField, Text, SelectField, Badge } from "@aws-amplify/ui-react";
import { deviceAPI } from "@demo/services/api";
import { useIoTReal } from "../../../hooks/useIoTReal";
import "./styles.scss";

interface IoTDevicesProps {
  onClose?: () => void;
}

export const IoTDevices: FC<IoTDevicesProps> = ({ onClose }) => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: "",
    type: "GPS Tracker",
    lat: "",
    lng: "",
    description: ""
  });

  const {
    isConnected,
    isInitializing,
    subscribeToDevice,
    getLatestLocation,
    startDeviceSimulation,
    updateDeviceLocation
  } = useIoTReal();

  // Load devices from backend
  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await deviceAPI.list();
      if (result.success && result.data) {
        setDevices(result.data);
      } else {
        console.error('Failed to load devices:', result.error);
        // Fallback to sample data for demo
        setDevices([
          { 
            id: "1", 
            deviceId: "device-001", 
            name: "Vehicle 001", 
            description: "Fleet vehicle #1",
            status: "ACTIVE", 
            latitude: 37.7749, 
            longitude: -122.4194 
          },
          { 
            id: "2", 
            deviceId: "device-002", 
            name: "Vehicle 002", 
            description: "Fleet vehicle #2",
            status: "ACTIVE", 
            latitude: 37.7849, 
            longitude: -122.4094 
          },
          { 
            id: "3", 
            deviceId: "device-003", 
            name: "Asset 001", 
            description: "Warehouse asset tracker",
            status: "OFFLINE", 
            latitude: 37.7649, 
            longitude: -122.4294 
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new device
  const handleCreateDevice = async () => {
    if (!newDevice.name || !newDevice.lat || !newDevice.lng) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const deviceData = {
        deviceId: `device-${Date.now()}`,
        name: newDevice.name,
        description: newDevice.description,
        latitude: parseFloat(newDevice.lat),
        longitude: parseFloat(newDevice.lng),
        status: 'ACTIVE' as const,
        trackerName: 'iot-dashboard-tracker-production'
      };

      const result = await deviceAPI.create(deviceData);
      if (result.success && result.data) {
        setDevices(prev => [...prev, result.data]);
        setNewDevice({ name: "", type: "GPS Tracker", lat: "", lng: "", description: "" });
        console.log('✅ Device created successfully');
      } else {
        console.error('Failed to create device:', result.error);
        alert('Failed to create device. Please try again.');
      }
    } catch (error) {
      console.error('Error creating device:', error);
      alert('Error creating device. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Delete device
  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    setLoading(true);
    try {
      const result = await deviceAPI.delete(deviceId);
      if (result.success) {
        setDevices(prev => prev.filter(device => device.id !== deviceId));
        console.log('✅ Device deleted successfully');
      } else {
        console.error('Failed to delete device:', result.error);
        alert('Failed to delete device. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('Error deleting device. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle device status
  const toggleDeviceStatus = async (device: any) => {
    const newStatus = device.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    
    setLoading(true);
    try {
      const result = await deviceAPI.update(device.id, { status: newStatus });
      if (result.success) {
        setDevices(prev => prev.map(d => 
          d.id === device.id ? { ...d, status: newStatus } : d
        ));
        console.log(`✅ Device ${newStatus.toLowerCase()}`);
      } else {
        console.error('Failed to update device:', result.error);
        alert('Failed to update device status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating device:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start tracking a device
  const handleStartTracking = async (device: any) => {
    try {
      const unsubscribe = await subscribeToDevice(device.deviceId);
      console.log(`🔄 Started tracking device: ${device.name}`);
      
      // Store unsubscribe function for cleanup
      (device as any)._unsubscribe = unsubscribe;
      
      // Update UI to show tracking state
      setDevices(prev => prev.map(d => 
        d.id === device.id ? { ...d, isTracking: true } : d
      ));
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  };

  // Start device simulation
  const handleStartSimulation = (device: any) => {
    try {
      const stopSimulation = startDeviceSimulation(device.deviceId);
      console.log(`🎮 Started simulation for device: ${device.name}`);
      
      // Store stop function for cleanup
      (device as any)._stopSimulation = stopSimulation;
      
      // Update UI to show simulation state
      setDevices(prev => prev.map(d => 
        d.id === device.id ? { ...d, isSimulating: true } : d
      ));
    } catch (error) {
      console.error('Failed to start simulation:', error);
    }
  };

  // Load devices on component mount
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  return (
    <View className="iot-devices">
      <Flex direction="column" gap="1rem">
        <Flex direction="row" justifyContent="space-between" alignItems="center">
          <Text variation="primary" fontSize="1.25rem" fontWeight="bold">
            IoT Device Management
          </Text>
          {isConnected ? (
            <Badge variation="success">Connected</Badge>
          ) : isInitializing ? (
            <Badge variation="warning">Connecting...</Badge>
          ) : (
            <Badge variation="error">Disconnected</Badge>
          )}
        </Flex>
        
        {/* Create New Device */}
        <View className="device-form">
          <Text fontWeight="bold" marginBottom="0.5rem">Add New Device</Text>
          <Flex direction="column" gap="0.5rem">
            <Flex direction="row" gap="0.5rem" wrap="wrap">
              <TextField
                label="Device Name"
                value={newDevice.name}
                onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                placeholder="Enter device name"
                isRequired
              />
              <SelectField
                label="Device Type"
                value={newDevice.type}
                onChange={(e) => setNewDevice({...newDevice, type: e.target.value})}
              >
                <option value="GPS Tracker">GPS Tracker</option>
                <option value="Asset Tracker">Asset Tracker</option>
                <option value="Fleet Tracker">Fleet Tracker</option>
              </SelectField>
            </Flex>
            <Flex direction="row" gap="0.5rem">
              <TextField
                label="Latitude"
                type="number"
                value={newDevice.lat}
                onChange={(e) => setNewDevice({...newDevice, lat: e.target.value})}
                placeholder="37.7749"
                step="0.000001"
                isRequired
              />
              <TextField
                label="Longitude"
                type="number"
                value={newDevice.lng}
                onChange={(e) => setNewDevice({...newDevice, lng: e.target.value})}
                placeholder="-122.4194"
                step="0.000001"
                isRequired
              />
            </Flex>
            <TextField
              label="Description (Optional)"
              value={newDevice.description}
              onChange={(e) => setNewDevice({...newDevice, description: e.target.value})}
              placeholder="Enter device description"
            />
            <Button 
              variation="primary" 
              onClick={handleCreateDevice}
              isLoading={loading}
              loadingText="Creating..."
            >
              Add Device
            </Button>
          </Flex>
        </View>

        {/* Device List */}
        <View className="device-list">
          <Text fontWeight="bold" marginBottom="0.5rem">
            Devices ({devices.length})
          </Text>
          {loading && devices.length === 0 ? (
            <Text>Loading devices...</Text>
          ) : devices.length === 0 ? (
            <Text color="gray">No devices found. Create your first device above.</Text>
          ) : (
            devices.map((device) => {
              const latestLocation = getLatestLocation(device.deviceId);
              return (
                <View key={device.id || device.deviceId} className="device-item">
                  <Flex direction="column" gap="0.5rem">
                    <Flex direction="row" justifyContent="space-between" alignItems="center">
                      <View>
                        <Text fontWeight="bold">{device.name}</Text>
                        <Text fontSize="0.875rem" color="gray">
                          ID: {device.deviceId} | Status: 
                          <span className={`status ${device.status?.toLowerCase()}`}>
                            {device.status}
                          </span>
                        </Text>
                        {device.description && (
                          <Text fontSize="0.75rem" color="gray">
                            {device.description}
                          </Text>
                        )}
                      </View>
                      <Flex direction="row" gap="0.5rem" wrap="wrap">
                        <Button 
                          size="small" 
                          variation={device.status === "ACTIVE" ? "warning" : "primary"}
                          onClick={() => toggleDeviceStatus(device)}
                          isDisabled={loading}
                        >
                          {device.status === "ACTIVE" ? "Disable" : "Enable"}
                        </Button>
                        {isConnected && (
                          <>
                            <Button 
                              size="small" 
                              variation="primary"
                              onClick={() => handleStartTracking(device)}
                              isDisabled={device.isTracking}
                            >
                              {device.isTracking ? "Tracking..." : "Track"}
                            </Button>
                            <Button 
                              size="small" 
                              variation="link"
                              onClick={() => handleStartSimulation(device)}
                              isDisabled={device.isSimulating}
                            >
                              {device.isSimulating ? "Simulating..." : "Simulate"}
                            </Button>
                          </>
                        )}
                        <Button 
                          size="small" 
                          variation="destructive"
                          onClick={() => handleDeleteDevice(device.id)}
                          isDisabled={loading}
                        >
                          Delete
                        </Button>
                      </Flex>
                    </Flex>
                    
                    {/* Location Info */}
                    <View className="location-info">
                      <Text fontSize="0.75rem" color="gray">
                        📍 {latestLocation ? 'Latest' : 'Initial'} Location: 
                        {' '}
                        {(latestLocation?.latitude || device.latitude)?.toFixed(6)}, 
                        {' '}
                        {(latestLocation?.longitude || device.longitude)?.toFixed(6)}
                        {latestLocation && (
                          <span style={{ marginLeft: '8px', color: '#4CAF50' }}>
                            🔄 Updated: {new Date(latestLocation.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </Text>
                    </View>
                  </Flex>
                </View>
              );
            })
          )}
        </View>

        {onClose && (
          <Button variation="link" onClick={onClose}>
            Close
          </Button>
        )}
      </Flex>
    </View>
  );
}; 