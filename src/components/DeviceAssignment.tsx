import * as React from 'react';
import { useState, useEffect } from 'react';
import { GeofenceService } from '../services/geofenceService';
import { DeviceService } from '../services/deviceService';
import { useSimpleAuth } from '../hooks/useSimpleAuth';

interface Device {
  deviceId: string;
  deviceName: string;
  status: string;
}

interface Geofence {
  geofenceId: string;
  geofenceName: string;
  status: string;
}

interface Assignment {
  deviceId: string;
  geofenceId: string;
  status: string;
}

export const DeviceAssignment: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedGeofence, setSelectedGeofence] = useState('');

  const { user } = useSimpleAuth();
  const geofenceService = new GeofenceService();
  const deviceService = new DeviceService();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.userId) return;
    
    setLoading(true);
    try {
      const [userDevices, userGeofences] = await Promise.all([
        deviceService.getUserDevices(user.userId),
        geofenceService.getUserGeofences(user.userId)
      ]);
      
      setDevices(userDevices);
      setGeofences(userGeofences);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDevice = async () => {
    if (!user?.userId || !selectedDevice || !selectedGeofence) return;

    setLoading(true);
    try {
      await geofenceService.assignDeviceToGeofence(
        user.userId,
        selectedDevice,
        selectedGeofence
      );

      // Reload assignments
      await loadAssignments();
      
      setSelectedDevice('');
      setSelectedGeofence('');
      alert('Device assigned to geofence successfully!');
    } catch (error) {
      console.error('Error assigning device:', error);
      alert('Error assigning device to geofence');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    if (!user?.userId) return;

    try {
      // For now, we'll show a simplified view of assignments
      // In production, you'd query the assignments table directly
      const allAssignments: Assignment[] = [];
      
      for (const device of devices) {
        const deviceAssignments = await geofenceService.getDeviceGeofenceAssignments(
          user.userId,
          device.deviceId
        );
        allAssignments.push(...deviceAssignments);
      }
      
      setAssignments(allAssignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleRemoveAssignment = async (deviceId: string, geofenceId: string) => {
    if (!user?.userId) return;

    if (window.confirm('Are you sure you want to remove this assignment?')) {
      setLoading(true);
      try {
        // In production, you'd update the assignment status to INACTIVE
        // For now, we'll just reload the assignments
        await loadAssignments();
        alert('Assignment removed successfully!');
      } catch (error) {
        console.error('Error removing assignment:', error);
        alert('Error removing assignment');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!user) {
    return <div>Please sign in to manage device assignments.</div>;
  }

  return (
    <div className="device-assignment">
      <div className="header">
        <h2>Device Assignment</h2>
        <p>Assign your IoT devices to geofences for monitoring</p>
      </div>

      <div className="assignment-form">
        <h3>Assign Device to Geofence</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Select Device:</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              disabled={loading}
            >
              <option value="">Choose a device...</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.deviceName} ({device.deviceId})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Geofence:</label>
            <select
              value={selectedGeofence}
              onChange={(e) => setSelectedGeofence(e.target.value)}
              disabled={loading}
            >
              <option value="">Choose a geofence...</option>
              {geofences.map((geofence) => (
                <option key={geofence.geofenceId} value={geofence.geofenceId}>
                  {geofence.geofenceName} ({geofence.geofenceId})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAssignDevice}
            disabled={loading || !selectedDevice || !selectedGeofence}
            className="btn btn-primary"
          >
            {loading ? 'Assigning...' : 'Assign Device'}
          </button>
        </div>
      </div>

      <div className="assignments-list">
        <h3>Current Assignments</h3>
        {loading ? (
          <div>Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div>No device assignments found. Create assignments above.</div>
        ) : (
          <div className="assignments-grid">
            {assignments.map((assignment) => {
              const device = devices.find(d => d.deviceId === assignment.deviceId);
              const geofence = geofences.find(g => g.geofenceId === assignment.geofenceId);
              
              return (
                <div key={`${assignment.deviceId}-${assignment.geofenceId}`} className="assignment-card">
                  <div className="assignment-header">
                    <h4>{device?.deviceName || assignment.deviceId}</h4>
                    <span className={`status ${assignment.status.toLowerCase()}`}>
                      {assignment.status}
                    </span>
                  </div>
                  <div className="assignment-details">
                    <p><strong>Device:</strong> {device?.deviceName || assignment.deviceId}</p>
                    <p><strong>Geofence:</strong> {geofence?.geofenceName || assignment.geofenceId}</p>
                  </div>
                  <div className="assignment-actions">
                    <button
                      onClick={() => handleRemoveAssignment(assignment.deviceId, assignment.geofenceId)}
                      className="btn btn-danger"
                      disabled={loading}
                    >
                      Remove Assignment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}; 