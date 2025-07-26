import * as React from 'react';
import { useState, useEffect } from 'react';
import { GeofenceService } from '../services/geofenceService';
import { useSimpleAuth } from '../hooks/useSimpleAuth';

interface Geofence {
  geofenceId: string;
  geofenceName: string;
  description?: string;
  geometry: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export const GeofenceManagement: React.FC = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    description: '',
    coordinates: '' // Simple polygon coordinates as string
  });

  const { user } = useSimpleAuth();
  const geofenceService = new GeofenceService();

  useEffect(() => {
    if (user) {
      loadGeofences();
    }
  }, [user]);

  const loadGeofences = async () => {
    if (!user?.userId) return;
    
    setLoading(true);
    try {
      const userGeofences = await geofenceService.getUserGeofences(user.userId);
      setGeofences(userGeofences);
    } catch (error) {
      console.error('Error loading geofences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.userId) return;

    setLoading(true);
    try {
      // Parse coordinates string to GeoJSON format
      const coordinates = parseCoordinates(newGeofence.coordinates);
      const geometry = {
        Polygon: [coordinates]
      };

      await geofenceService.createGeofence(user.userId, {
        name: newGeofence.name,
        description: newGeofence.description,
        geometry
      });

      setNewGeofence({ name: '', description: '', coordinates: '' });
      setShowCreateForm(false);
      await loadGeofences();
    } catch (error) {
      console.error('Error creating geofence:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseCoordinates = (coordString: string): number[][] => {
    // Parse coordinates in format: "lat1,lng1;lat2,lng2;lat3,lng3;..."
    return coordString.split(';').map(coord => {
      const [lat, lng] = coord.split(',').map(Number);
      return [lng, lat]; // GeoJSON expects [longitude, latitude]
    });
  };

  const handleDeleteGeofence = async (geofenceId: string) => {
    if (!user?.userId) return;

    if (window.confirm('Are you sure you want to delete this geofence?')) {
      setLoading(true);
      try {
        await geofenceService.deleteGeofence(user.userId, geofenceId);
        await loadGeofences();
      } catch (error) {
        console.error('Error deleting geofence:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!user) {
    return <div>Please sign in to manage geofences.</div>;
  }

  return (
    <div className="geofence-management">
      <div className="header">
        <h2>Geofence Management</h2>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          {showCreateForm ? 'Cancel' : 'Add New Geofence'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateGeofence} className="create-geofence-form">
          <h3>Create New Geofence</h3>
          <div className="form-group">
            <label>Geofence Name:</label>
            <input
              type="text"
              value={newGeofence.name}
              onChange={(e) => setNewGeofence({ ...newGeofence, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={newGeofence.description}
              onChange={(e) => setNewGeofence({ ...newGeofence, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Coordinates (format: lat1,lng1;lat2,lng2;lat3,lng3;...):</label>
            <textarea
              value={newGeofence.coordinates}
              onChange={(e) => setNewGeofence({ ...newGeofence, coordinates: e.target.value })}
              placeholder="Example: 51.5074,-0.1278;51.5074,-0.1178;51.5174,-0.1178;51.5174,-0.1278"
              required
            />
            <small>Enter polygon coordinates separated by semicolons. Each coordinate should be latitude,longitude.</small>
          </div>
          <button type="submit" disabled={loading} className="btn btn-success">
            {loading ? 'Creating...' : 'Create Geofence'}
          </button>
        </form>
      )}

      <div className="geofences-list">
        <h3>Your Geofences</h3>
        {loading ? (
          <div>Loading geofences...</div>
        ) : geofences.length === 0 ? (
          <div>No geofences found. Create your first geofence above.</div>
        ) : (
          <div className="geofences-grid">
            {geofences.map((geofence) => (
              <div key={geofence.geofenceId} className="geofence-card">
                <div className="geofence-header">
                  <h4>{geofence.geofenceName}</h4>
                  <span className={`status ${geofence.status.toLowerCase()}`}>
                    {geofence.status}
                  </span>
                </div>
                <div className="geofence-details">
                  <p><strong>ID:</strong> {geofence.geofenceId}</p>
                  {geofence.description && <p><strong>Description:</strong> {geofence.description}</p>}
                  <p><strong>Created:</strong> {new Date(geofence.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="geofence-actions">
                  <button
                    onClick={() => handleDeleteGeofence(geofence.geofenceId)}
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