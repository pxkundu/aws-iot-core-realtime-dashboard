import * as React from 'react';
import { useState, useEffect } from 'react';
import { DeviceService } from '../services/deviceService';
import { useSimpleAuth } from '../hooks/useSimpleAuth';

interface Device {
  deviceId: string;
  deviceName: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'OFFLINE';
  lastLocation?: string;
  createdAt: string;
}

export const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDevice, setNewDevice] = useState({
    deviceId: '',
    name: '',
    description: '',
    latitude: 0,
    longitude: 0
  });

  const { user } = useSimpleAuth();
  const deviceService = new DeviceService();

  useEffect(() => {
    if (user) {
      loadDevices();
    }
  }, [user]);

  const loadDevices = async () => {
    if (!user?.userId) return;
    
    setLoading(true);
    try {
      const userDevices = await deviceService.getUserDevices(user.userId);
      setDevices(userDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.userId) return;

    setLoading(true);
    try {
      await deviceService.createDevice(user.userId, {
        deviceId: newDevice.deviceId,
        name: newDevice.name,
        description: newDevice.description,
        latitude: newDevice.latitude,
        longitude: newDevice.longitude
      });

      setNewDevice({ deviceId: '', name: '', description: '', latitude: 0, longitude: 0 });
      setShowCreateForm(false);
      await loadDevices();
    } catch (error) {
      console.error('Error creating device:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!user?.userId) return;

    if (window.confirm('Are you sure you want to delete this device?')) {
      setLoading(true);
      try {
        await deviceService.deleteDevice(user.userId, deviceId);
        await loadDevices();
      } catch (error) {
        console.error('Error deleting device:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!user) {
    return <div>Please sign in to manage devices.</div>;
  }

  return (
    <div className="device-management">
      <div className="header">
        <h2>Device Management</h2>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          {showCreateForm ? 'Cancel' : 'Add New Device'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateDevice} className="create-device-form">
          <h3>Create New Device</h3>
          <div className="form-group">
            <label>Device ID:</label>
            <input
              type="text"
              value={newDevice.deviceId}
              onChange={(e) => setNewDevice({ ...newDevice, deviceId: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Device Name:</label>
            <input
              type="text"
              value={newDevice.name}
              onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={newDevice.description}
              onChange={(e) => setNewDevice({ ...newDevice, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Latitude:</label>
            <input
              type="number"
              step="any"
              value={newDevice.latitude}
              onChange={(e) => setNewDevice({ ...newDevice, latitude: parseFloat(e.target.value) })}
              required
            />
          </div>
          <div className="form-group">
            <label>Longitude:</label>
            <input
              type="number"
              step="any"
              value={newDevice.longitude}
              onChange={(e) => setNewDevice({ ...newDevice, longitude: parseFloat(e.target.value) })}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-success">
            {loading ? 'Creating...' : 'Create Device'}
          </button>
        </form>
      )}

      <div className="devices-list">
        <h3>Your Devices</h3>
        {loading ? (
          <div>Loading devices...</div>
        ) : devices.length === 0 ? (
          <div>No devices found. Create your first device above.</div>
        ) : (
          <div className="devices-grid">
            {devices.map((device) => (
              <div key={device.deviceId} className="device-card">
                <div className="device-header">
                  <h4>{device.deviceName}</h4>
                  <span className={`status ${device.status.toLowerCase()}`}>
                    {device.status}
                  </span>
                </div>
                <div className="device-details">
                  <p><strong>ID:</strong> {device.deviceId}</p>
                  {device.description && <p><strong>Description:</strong> {device.description}</p>}
                  <p><strong>Created:</strong> {new Date(device.createdAt).toLocaleDateString()}</p>
                  {device.lastLocation && (
                    <p><strong>Last Location:</strong> {device.lastLocation}</p>
                  )}
                </div>
                <div className="device-actions">
                  <button
                    onClick={() => handleDeleteDevice(device.deviceId)}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 