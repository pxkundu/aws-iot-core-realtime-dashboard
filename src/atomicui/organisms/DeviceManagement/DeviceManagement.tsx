/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { FC, useState, useEffect, useCallback } from "react";
import { 
  Flex, 
  View, 
  Button, 
  TextField, 
  Text, 
  Badge,
  Card,
  Divider,
  SelectField,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@aws-amplify/ui-react";
import { useAuthContext } from "@demo/core/AuthProvider";
import { deviceAPI, trackerAPI, type ApiResult } from "@demo/services/api";
import type { Schema } from "../../../../amplify/data/resource"
import "./styles.scss";

interface DeviceManagementProps {
  onClose?: () => void;
  onOpenSignInModal?: () => void;
}

type DeviceType = Schema['Device']['type'];
type TrackerType = Schema['Tracker']['type'];

const DeviceManagement: FC<DeviceManagementProps> = ({ onClose, onOpenSignInModal }) => {
  const { isUserSignedIn } = useAuthContext();
  const [devices, setDevices] = useState<DeviceType[]>([]);
  const [trackers, setTrackers] = useState<TrackerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingDevice, setEditingDevice] = useState<DeviceType | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    deviceId: "",
    name: "",
    description: "",
    latitude: "",
    longitude: "",
    status: "ACTIVE" as const,
    trackerName: ""
  });

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setFormData({
      deviceId: "",
      name: "",
      description: "",
      latitude: "",
      longitude: "",
      status: "ACTIVE" as const,
      trackerName: ""
    });
    setEditingDevice(null);
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  // Load devices and trackers from API
  const loadDevices = useCallback(async () => {
    if (!isUserSignedIn) return;
    
    setLoading(true);
    try {
      const [devicesResult, trackersResult] = await Promise.all([
        deviceAPI.list(),
        trackerAPI.list()
      ]);
      
      if (devicesResult.success && devicesResult.data) {
        setDevices(devicesResult.data);
      } else {
        setError(devicesResult.error || 'Failed to load devices');
      }
      
      if (trackersResult.success && trackersResult.data) {
        setTrackers(trackersResult.data);
      }
    } catch (err) {
      setError('Error loading devices');
      console.error('Error loading devices:', err);
    } finally {
      setLoading(false);
    }
  }, [isUserSignedIn]);

  // Validate coordinates
  const validateCoordinates = (lat: string, lng: string): boolean => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    return !isNaN(latitude) && !isNaN(longitude) && 
           latitude >= -90 && latitude <= 90 && 
           longitude >= -180 && longitude <= 180;
  };

  // Create or update device
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.deviceId || !formData.name) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.latitude && formData.longitude && 
        !validateCoordinates(formData.latitude, formData.longitude)) {
      setError("Please enter valid latitude (-90 to 90) and longitude (-180 to 180)");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      let result: ApiResult<DeviceType | null>;
      
      const deviceData = {
        deviceId: formData.deviceId,
        name: formData.name,
        description: formData.description,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        status: formData.status,
        trackerName: formData.trackerName || undefined
      };
      
      if (editingDevice) {
        // Update existing device
        result = await deviceAPI.update(editingDevice.id, deviceData);
        
        if (result.success && result.data) {
          setSuccess(`Device "${formData.name}" updated successfully!`);
          setDevices(prev => prev.map(d => 
            d.id === editingDevice.id ? { ...d, ...result.data } : d
          ));
        }
      } else {
        // Create new device
        result = await deviceAPI.create(deviceData);
        
        if (result.success && result.data) {
          setSuccess(`Device "${formData.name}" created successfully!`);
          setDevices(prev => [...prev, result.data!]);
        }
      }
      
      if (!result.success) {
        setError(result.error || 'Operation failed');
        return;
      }
      
      resetForm();
    } catch (err) {
      setError('Error saving device');
      console.error('Error saving device:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete device
  const handleDelete = async (device: DeviceType) => {
    if (!confirm(`Are you sure you want to delete "${device.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const result: ApiResult = await deviceAPI.delete(device.id);
      
      if (result.success) {
        setSuccess(`Device "${device.name}" deleted successfully!`);
        setDevices(prev => prev.filter(d => d.id !== device.id));
      } else {
        setError(result.error || 'Failed to delete device');
      }
    } catch (err) {
      setError('Error deleting device');
      console.error('Error deleting device:', err);
    } finally {
      setLoading(false);
    }
  };

  // Edit device
  const handleEdit = (device: DeviceType) => {
    setEditingDevice(device);
    setFormData({
      deviceId: device.deviceId || "",
      name: device.name || "",
      description: device.description || "",
      latitude: device.latitude ? device.latitude.toString() : "",
      longitude: device.longitude ? device.longitude.toString() : "",
      status: (device.status as any) || "ACTIVE",
      trackerName: device.trackerName || ""
    });
    clearMessages();
  };

  // Toggle device status
  const toggleStatus = async (device: DeviceType) => {
    setLoading(true);
    clearMessages();

    try {
      const newStatus = device.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const result: ApiResult<DeviceType | null> = await deviceAPI.update(device.id, { status: newStatus });
      
      if (result.success && result.data) {
        setSuccess(`Device "${device.name}" ${newStatus.toLowerCase()}!`);
        setDevices(prev => prev.map(d => 
          d.id === device.id ? { ...d, status: newStatus } : d
        ));
      } else {
        setError(result.error || 'Failed to update device status');
      }
    } catch (err) {
      setError('Error updating device status');
      console.error('Error updating device status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      ACTIVE: { variation: "success" as const, text: "Active" },
      INACTIVE: { variation: "warning" as const, text: "Inactive" },
      OFFLINE: { variation: "error" as const, text: "Offline" }
    };
    
    const { variation, text } = config[status as keyof typeof config] || config.INACTIVE;
    return <Badge variation={variation}>{text}</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCoordinates = (lat?: number | null, lng?: number | null) => {
    if (lat === undefined || lat === null || lng === undefined || lng === null) return "No location";
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const getTrackerName = (trackerName?: string | null) => {
    if (!trackerName) return "No tracker";
    const tracker = trackers.find(t => t.trackerId === trackerName);
    return tracker ? tracker.name : trackerName;
  };

  // Load devices on component mount
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  if (!isUserSignedIn) {
    return (
      <div className="device-management-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
        <Card className="device-management-modal">
          <div className="modal-header">
            <div className="modal-title">
              📱 Device Management
            </div>
            <div className="modal-description">
              Please sign in to manage your devices
            </div>
          </div>
          
          <div className="button-section">
            <Button 
              variation="primary" 
              onClick={() => {
                handleClose();
                onOpenSignInModal?.();
              }}
              isFullWidth
              size="large"
            >
              Sign In
            </Button>
          </div>
          
          <div className="close-section">
            <Button 
              className="close-button"
              variation="link" 
              onClick={handleClose}
            >
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="device-management-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <Card className="device-management-modal">
        <Flex direction="column">
          
          {/* Header */}
          <div className="modal-header">
            <div className="modal-title">
              📱 Device Management
            </div>
            <div className="modal-description">
              Create and manage IoT devices with location tracking
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert variation="error" isDismissible onDismiss={clearMessages}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variation="success" isDismissible onDismiss={clearMessages}>
              {success}
            </Alert>
          )}

          {/* CRUD Form */}
          <div className="form-section">
            <form onSubmit={handleSubmit}>
              <Text className="section-title">
                {editingDevice ? `Edit Device: ${editingDevice.name}` : "Create New Device"}
              </Text>
              
              <div className="form-row">
                <TextField
                  label="Device ID *"
                  value={formData.deviceId}
                  onChange={(e) => setFormData({...formData, deviceId: e.target.value})}
                  placeholder="e.g. device-001"
                  isRequired
                  isDisabled={loading || !!editingDevice}
                  descriptiveText="Unique identifier for the device"
                />
                <TextField
                  label="Device Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter device name"
                  isRequired
                  isDisabled={loading}
                />
              </div>
              
              <div className="form-row">
                <TextField
                  label="Latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  placeholder="e.g. 37.7749"
                  isDisabled={loading}
                  descriptiveText="Latitude (-90 to 90)"
                />
                <TextField
                  label="Longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                  placeholder="e.g. -122.4194"
                  isDisabled={loading}
                  descriptiveText="Longitude (-180 to 180)"
                />
              </div>
              
              <div className="form-row">
                <SelectField
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  isDisabled={loading}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="OFFLINE">Offline</option>
                </SelectField>
                <SelectField
                  label="Tracker"
                  value={formData.trackerName}
                  onChange={(e) => setFormData({...formData, trackerName: e.target.value})}
                  isDisabled={loading}
                >
                  <option value="">No tracker</option>
                  {trackers.map((tracker) => (
                    <option key={tracker.id} value={tracker.trackerId}>
                      {tracker.name} ({tracker.trackerId})
                    </option>
                  ))}
                </SelectField>
              </div>
              
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter device description"
                isDisabled={loading}
              />
              
              <div className="form-actions">
                <Button 
                  type="submit"
                  variation="primary" 
                  isLoading={loading}
                  loadingText={editingDevice ? "Updating..." : "Creating..."}
                  isFullWidth
                  size="large"
                >
                  {editingDevice ? "Update Device" : "Create Device"}
                </Button>
                
                <Flex direction="row" gap="0.5rem" justifyContent="center" marginTop="0.75rem">
                  {editingDevice && (
                    <Button 
                      type="button"
                      variation="link"
                      onClick={resetForm}
                      isDisabled={loading}
                    >
                      Cancel Edit
                    </Button>
                  )}
                  
                  <Button 
                    type="button"
                    variation="link"
                    onClick={loadDevices}
                    isDisabled={loading}
                  >
                    🔄 Refresh
                  </Button>
                </Flex>
              </div>
            </form>
          </div>

          <Divider />

          {/* Devices Table */}
          <div className="devices-section">
            <Text className="section-title" marginBottom="1rem">
              Your Devices ({devices.length})
            </Text>
            
            {loading && devices.length === 0 ? (
              <div className="empty-state">
                <Text>Loading devices...</Text>
              </div>
            ) : devices.length === 0 ? (
              <div className="empty-state">
                <Text color="gray">
                  No devices found. Create your first device above.
                </Text>
              </div>
            ) : (
              <div className="table-container">
                <Table className="devices-table">
                  <TableHead>
                    <TableRow>
                      <TableCell as="th">Name</TableCell>
                      <TableCell as="th">Device ID</TableCell>
                      <TableCell as="th">Status</TableCell>
                      <TableCell as="th">Location</TableCell>
                      <TableCell as="th">Tracker</TableCell>
                      <TableCell as="th">Last Updated</TableCell>
                      <TableCell as="th">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {devices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell>
                          <View>
                            <Text fontWeight="bold">{device.name}</Text>
                            {device.description && (
                              <Text fontSize="0.75rem" color="gray">
                                {device.description}
                              </Text>
                            )}
                          </View>
                        </TableCell>
                        <TableCell>
                          <Text fontFamily="monospace" fontSize="0.875rem">
                            {device.deviceId}
                          </Text>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(device.status || 'INACTIVE')}
                        </TableCell>
                        <TableCell>
                          <Text fontSize="0.75rem" fontFamily="monospace">
                            {formatCoordinates(device.latitude, device.longitude)}
                          </Text>
                        </TableCell>
                                                 <TableCell>
                           <Text fontSize="0.875rem">
                             {getTrackerName(device.trackerName || undefined)}
                           </Text>
                         </TableCell>
                        <TableCell>
                                                     <Text fontSize="0.875rem">
                             {formatDate(device.lastUpdated || undefined)}
                           </Text>
                        </TableCell>
                        <TableCell>
                          <Flex direction="row" gap="0.25rem" wrap="wrap">
                            <Button 
                              size="small" 
                              variation="primary"
                              onClick={() => handleEdit(device)}
                              isDisabled={loading}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="small" 
                              variation={device.status === 'ACTIVE' ? "warning" : "primary"}
                              onClick={() => toggleStatus(device)}
                              isDisabled={loading}
                            >
                              {device.status === 'ACTIVE' ? "Disable" : "Enable"}
                            </Button>
                            <Button 
                              size="small" 
                              variation="destructive"
                              onClick={() => handleDelete(device)}
                              isDisabled={loading}
                            >
                              Delete
                            </Button>
                          </Flex>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="close-section">
            <Button 
              className="close-button"
              variation="link" 
              onClick={handleClose} 
              isDisabled={loading}
            >
              Close
            </Button>
          </div>

        </Flex>
      </Card>
    </div>
  );
};

export { DeviceManagement }; 