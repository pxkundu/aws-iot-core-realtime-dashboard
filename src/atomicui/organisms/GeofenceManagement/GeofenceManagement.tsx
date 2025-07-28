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
  TableBody,
  TextAreaField
} from "@aws-amplify/ui-react";
import { useAuthContext } from "@demo/core/AuthProvider";
import { geofenceAPI, type ApiResult } from "@demo/services/api";
import type { Schema } from "../../../../amplify/data/resource"
import "./styles.scss";

interface GeofenceManagementProps {
  onClose?: () => void;
  onOpenSignInModal?: () => void;
}

type GeofenceType = Schema['Geofence']['type'];

const GeofenceManagement: FC<GeofenceManagementProps> = ({ onClose, onOpenSignInModal }) => {
  const { user, isUserSignedIn } = useAuthContext();
  const [geofences, setGeofences] = useState<GeofenceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingGeofence, setEditingGeofence] = useState<GeofenceType | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    geofenceId: "",
    name: "",
    description: "",
    geometry: "",
    status: "ACTIVE" as const
  });

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setFormData({
      geofenceId: "",
      name: "",
      description: "",
      geometry: "",
      status: "ACTIVE" as const
    });
    setEditingGeofence(null);
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  // Load geofences from API
  const loadGeofences = useCallback(async () => {
    if (!isUserSignedIn) return;
    
    setLoading(true);
    try {
      const result: ApiResult<GeofenceType[]> = await geofenceAPI.list();
      if (result.success && result.data) {
        setGeofences(result.data);
      } else {
        setError(result.error || 'Failed to load geofences');
      }
    } catch (err) {
      setError('Error loading geofences');
      console.error('Error loading geofences:', err);
    } finally {
      setLoading(false);
    }
  }, [isUserSignedIn]);

  // Validate GeoJSON geometry
  const validateGeometry = (geometry: string): boolean => {
    try {
      const parsed = JSON.parse(geometry);
      // Basic GeoJSON validation
      return (
        parsed &&
        typeof parsed === 'object' &&
        parsed.type &&
        parsed.coordinates &&
        ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(parsed.type)
      );
    } catch {
      return false;
    }
  };

  // Create or update geofence
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.geofenceId || !formData.name || !formData.geometry) {
      setError("Please fill in all required fields");
      return;
    }

    if (!validateGeometry(formData.geometry)) {
      setError("Please enter valid GeoJSON geometry");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      let result: ApiResult<GeofenceType | null>;
      
      if (editingGeofence) {
        // Update existing geofence
        result = await geofenceAPI.update(editingGeofence.id, {
          geofenceId: formData.geofenceId,
          name: formData.name,
          description: formData.description,
          geometry: formData.geometry,
          status: formData.status
        });
        
        if (result.success && result.data) {
          setSuccess(`Geofence "${formData.name}" updated successfully!`);
          setGeofences(prev => prev.map(g => 
            g.id === editingGeofence.id ? { ...g, ...result.data } : g
          ));
        }
      } else {
        // Create new geofence
        result = await geofenceAPI.create({
          geofenceId: formData.geofenceId,
          name: formData.name,
          description: formData.description,
          geometry: formData.geometry,
          status: formData.status
        });
        
        if (result.success && result.data) {
          setSuccess(`Geofence "${formData.name}" created successfully!`);
          setGeofences(prev => [...prev, result.data!]);
        }
      }
      
      if (!result.success) {
        setError(result.error || 'Operation failed');
        return;
      }
      
      resetForm();
    } catch (err) {
      setError('Error saving geofence');
      console.error('Error saving geofence:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete geofence
  const handleDelete = async (geofence: GeofenceType) => {
    if (!confirm(`Are you sure you want to delete "${geofence.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const result: ApiResult = await geofenceAPI.delete(geofence.id);
      
      if (result.success) {
        setSuccess(`Geofence "${geofence.name}" deleted successfully!`);
        setGeofences(prev => prev.filter(g => g.id !== geofence.id));
      } else {
        setError(result.error || 'Failed to delete geofence');
      }
    } catch (err) {
      setError('Error deleting geofence');
      console.error('Error deleting geofence:', err);
    } finally {
      setLoading(false);
    }
  };

  // Edit geofence
  const handleEdit = (geofence: GeofenceType) => {
    setEditingGeofence(geofence);
    setFormData({
      geofenceId: geofence.geofenceId || "",
      name: geofence.name || "",
      description: geofence.description || "",
      geometry: geofence.geometry || "",
      status: (geofence.status as any) || "ACTIVE"
    });
    clearMessages();
  };

  // Toggle geofence status
  const toggleStatus = async (geofence: GeofenceType) => {
    setLoading(true);
    clearMessages();

    try {
      const newStatus = geofence.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const result: ApiResult<GeofenceType | null> = await geofenceAPI.update(geofence.id, { status: newStatus });
      
      if (result.success && result.data) {
        setSuccess(`Geofence "${geofence.name}" ${newStatus.toLowerCase()}!`);
        setGeofences(prev => prev.map(g => 
          g.id === geofence.id ? { ...g, status: newStatus } : g
        ));
      } else {
        setError(result.error || 'Failed to update geofence status');
      }
    } catch (err) {
      setError('Error updating geofence status');
      console.error('Error updating geofence status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      ACTIVE: { variation: "success" as const, text: "Active" },
      INACTIVE: { variation: "warning" as const, text: "Inactive" }
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

  const getGeometryType = (geometry: string) => {
    try {
      const parsed = JSON.parse(geometry);
      return parsed.type || "Unknown";
    } catch {
      return "Invalid";
    }
  };

  const getGeometryPreview = (geometry: string) => {
    try {
      const parsed = JSON.parse(geometry);
      if (parsed.coordinates) {
        const coords = JSON.stringify(parsed.coordinates).substring(0, 50);
        return coords.length > 47 ? coords + "..." : coords;
      }
      return "No coordinates";
    } catch {
      return "Invalid GeoJSON";
    }
  };

  // Load geofences on component mount
  useEffect(() => {
    loadGeofences();
  }, [loadGeofences]);

  if (!isUserSignedIn) {
    return (
      <div className="geofence-management-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
        <Card className="geofence-management-modal">
          <div className="modal-header">
            <div className="modal-title">
              🗺️ Geofence Management
            </div>
            <div className="modal-description">
              Please sign in to manage your geofences
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
    <div className="geofence-management-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <Card className="geofence-management-modal">
        <Flex direction="column">
          
          {/* Header */}
          <div className="modal-header">
            <div className="modal-title">
              🗺️ Geofence Management
            </div>
            <div className="modal-description">
              Create and manage geofences for location-based triggers
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
                {editingGeofence ? `Edit Geofence: ${editingGeofence.name}` : "Create New Geofence"}
              </Text>
              
              <div className="form-row">
                <TextField
                  label="Geofence ID *"
                  value={formData.geofenceId}
                  onChange={(e) => setFormData({...formData, geofenceId: e.target.value})}
                  placeholder="e.g. my-geofence-001"
                  isRequired
                  isDisabled={loading || !!editingGeofence}
                  descriptiveText="Unique identifier for the geofence"
                />
                <TextField
                  label="Geofence Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter geofence name"
                  isRequired
                  isDisabled={loading}
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
                </SelectField>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter geofence description"
                  isDisabled={loading}
                />
              </div>
              
              <TextAreaField
                label="Geometry (GeoJSON) *"
                value={formData.geometry}
                onChange={(e) => setFormData({...formData, geometry: e.target.value})}
                placeholder='{"type": "Polygon", "coordinates": [[[lng1,lat1], [lng2,lat2], [lng3,lat3], [lng1,lat1]]]}'
                isRequired
                isDisabled={loading}
                rows={4}
                descriptiveText="Enter valid GeoJSON geometry (Point, Polygon, etc.)"
              />
              
              <div className="form-actions">
                <Button 
                  type="submit"
                  variation="primary" 
                  isLoading={loading}
                  loadingText={editingGeofence ? "Updating..." : "Creating..."}
                  isFullWidth
                  size="large"
                >
                  {editingGeofence ? "Update Geofence" : "Create Geofence"}
                </Button>
                
                <Flex direction="row" gap="0.5rem" justifyContent="center" marginTop="0.75rem">
                  {editingGeofence && (
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
                    onClick={loadGeofences}
                    isDisabled={loading}
                  >
                    🔄 Refresh
                  </Button>
                </Flex>
              </div>
            </form>
          </div>

          <Divider />

          {/* Geofences Table */}
          <div className="geofences-section">
            <Text className="section-title" marginBottom="1rem">
              Your Geofences ({geofences.length})
            </Text>
            
            {loading && geofences.length === 0 ? (
              <div className="empty-state">
                <Text>Loading geofences...</Text>
              </div>
            ) : geofences.length === 0 ? (
              <div className="empty-state">
                <Text color="gray">
                  No geofences found. Create your first geofence above.
                </Text>
              </div>
            ) : (
              <div className="table-container">
                <Table className="geofences-table">
                  <TableHead>
                    <TableRow>
                      <TableCell as="th">Name</TableCell>
                      <TableCell as="th">Geofence ID</TableCell>
                      <TableCell as="th">Type</TableCell>
                      <TableCell as="th">Status</TableCell>
                      <TableCell as="th">Geometry Preview</TableCell>
                      <TableCell as="th">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {geofences.map((geofence) => (
                      <TableRow key={geofence.id}>
                        <TableCell>
                          <View>
                            <Text fontWeight="bold">{geofence.name}</Text>
                            {geofence.description && (
                              <Text fontSize="0.75rem" color="gray">
                                {geofence.description}
                              </Text>
                            )}
                          </View>
                        </TableCell>
                        <TableCell>
                          <Text fontFamily="monospace" fontSize="0.875rem">
                            {geofence.geofenceId}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Badge variation="info">
                            {getGeometryType(geofence.geometry || "")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(geofence.status || 'INACTIVE')}
                        </TableCell>
                        <TableCell>
                          <Text fontSize="0.75rem" fontFamily="monospace" color="gray">
                            {getGeometryPreview(geofence.geometry || "")}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Flex direction="row" gap="0.25rem" wrap="wrap">
                            <Button 
                              size="small" 
                              variation="primary"
                              onClick={() => handleEdit(geofence)}
                              isDisabled={loading}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="small" 
                              variation={geofence.status === 'ACTIVE' ? "warning" : "primary"}
                              onClick={() => toggleStatus(geofence)}
                              isDisabled={loading}
                            >
                              {geofence.status === 'ACTIVE' ? "Disable" : "Enable"}
                            </Button>
                            <Button 
                              size="small" 
                              variation="destructive"
                              onClick={() => handleDelete(geofence)}
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

export { GeofenceManagement }; 