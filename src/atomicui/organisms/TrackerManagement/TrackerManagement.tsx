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
import { trackerAPI, type ApiResult } from "@demo/services/api";
import type { Schema } from "../../../../amplify/data/resource"
import "./styles.scss";

interface TrackerManagementProps {
  onClose?: () => void;
  onOpenSignInModal?: () => void;
}

type TrackerType = Schema['Tracker']['type'];

const TrackerManagement: FC<TrackerManagementProps> = ({ onClose, onOpenSignInModal }) => {
  const { isUserSignedIn } = useAuthContext();
  const [trackers, setTrackers] = useState<TrackerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingTracker, setEditingTracker] = useState<TrackerType | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    trackerId: "",
    name: "",
    description: "",
    region: "eu-west-1",
    status: "ACTIVE" as const,
    kmsKeyId: "",
    tags: "",
    eventFiltering: ""
  });

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setFormData({
      trackerId: "",
      name: "",
      description: "",
      region: "eu-west-1",
      status: "ACTIVE" as const,
      kmsKeyId: "",
      tags: "",
      eventFiltering: ""
    });
    setEditingTracker(null);
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  // Load trackers from API
  const loadTrackers = useCallback(async () => {
    if (!isUserSignedIn) return;
    
    setLoading(true);
    try {
      const result: ApiResult<TrackerType[]> = await trackerAPI.list();
      if (result.success && result.data) {
        setTrackers(result.data);
      } else {
        setError(result.error || 'Failed to load trackers');
      }
    } catch (err) {
      setError('Error loading trackers');
      console.error('Error loading trackers:', err);
    } finally {
      setLoading(false);
    }
  }, [isUserSignedIn]);

  // Create or update tracker
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.trackerId || !formData.name || !formData.region) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate JSON fields if provided
    if (formData.tags) {
      try {
        JSON.parse(formData.tags);
      } catch {
        setError("Invalid JSON format for Tags");
        return;
      }
    }

    if (formData.eventFiltering) {
      try {
        JSON.parse(formData.eventFiltering);
      } catch {
        setError("Invalid JSON format for Event Filtering");
        return;
      }
    }

    setLoading(true);
    clearMessages();

    try {
      let result: ApiResult<TrackerType | null>;
      
      if (editingTracker) {
        // Update existing tracker
        result = await trackerAPI.update(editingTracker.id, {
          trackerId: formData.trackerId,
          name: formData.name,
          description: formData.description,
          region: formData.region,
          status: formData.status,
          kmsKeyId: formData.kmsKeyId || undefined,
          tags: formData.tags ? JSON.parse(formData.tags) : undefined,
          eventFiltering: formData.eventFiltering ? JSON.parse(formData.eventFiltering) : undefined
        });
        
        if (result.success && result.data) {
          setSuccess(`Tracker "${formData.name}" updated successfully!`);
          setTrackers(prev => prev.map(t => 
            t.id === editingTracker.id ? { ...t, ...result.data } : t
          ));
        }
      } else {
        // Create new tracker
        result = await trackerAPI.create({
          trackerId: formData.trackerId,
          name: formData.name,
          description: formData.description,
          region: formData.region,
          status: formData.status,
          kmsKeyId: formData.kmsKeyId || undefined,
          tags: formData.tags ? JSON.parse(formData.tags) : undefined,
          eventFiltering: formData.eventFiltering ? JSON.parse(formData.eventFiltering) : undefined
        });
        
        if (result.success && result.data) {
          setSuccess(`Tracker "${formData.name}" created successfully!`);
          setTrackers(prev => [...prev, result.data!]);
        }
      }
      
      if (!result.success) {
        setError(result.error || 'Operation failed');
        return;
      }
      
      resetForm();
    } catch (err) {
      setError('Error saving tracker');
      console.error('Error saving tracker:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete tracker
  const handleDelete = async (tracker: TrackerType) => {
    if (!confirm(`Are you sure you want to delete "${tracker.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const result: ApiResult = await trackerAPI.delete(tracker.id);
      
      if (result.success) {
        setSuccess(`Tracker "${tracker.name}" deleted successfully!`);
        setTrackers(prev => prev.filter(t => t.id !== tracker.id));
      } else {
        setError(result.error || 'Failed to delete tracker');
      }
    } catch (err) {
      setError('Error deleting tracker');
      console.error('Error deleting tracker:', err);
    } finally {
      setLoading(false);
    }
  };

  // Edit tracker
  const handleEdit = (tracker: TrackerType) => {
    setEditingTracker(tracker);
    setFormData({
      trackerId: tracker.trackerId || "",
      name: tracker.name || "",
      description: tracker.description || "",
      region: tracker.region || "eu-west-1",
      status: (tracker.status as any) || "ACTIVE",
      kmsKeyId: tracker.kmsKeyId || "",
      tags: tracker.tags ? JSON.stringify(tracker.tags, null, 2) : "",
      eventFiltering: tracker.eventFiltering ? JSON.stringify(tracker.eventFiltering, null, 2) : ""
    });
    clearMessages();
  };

  // Toggle tracker status
  const toggleStatus = async (tracker: TrackerType) => {
    setLoading(true);
    clearMessages();

    try {
      const newStatus = tracker.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const result: ApiResult<TrackerType | null> = await trackerAPI.update(tracker.id, { status: newStatus });
      
      if (result.success && result.data) {
        setSuccess(`Tracker "${tracker.name}" ${newStatus.toLowerCase()}!`);
        setTrackers(prev => prev.map(t => 
          t.id === tracker.id ? { ...t, status: newStatus } : t
        ));
      } else {
        setError(result.error || 'Failed to update tracker status');
      }
    } catch (err) {
      setError('Error updating tracker status');
      console.error('Error updating tracker status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      ACTIVE: { variation: "success" as const, text: "Active" },
      INACTIVE: { variation: "warning" as const, text: "Inactive" },
      CREATING: { variation: "info" as const, text: "Creating..." },
      DELETING: { variation: "error" as const, text: "Deleting..." }
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

  // Load trackers on component mount
  useEffect(() => {
    loadTrackers();
  }, [loadTrackers]);

  if (!isUserSignedIn) {
    return (
      <div className="tracker-management-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
        <Card className="tracker-management-modal">
          <div className="modal-header">
            <div className="modal-title">
              📍 Tracker Management
            </div>
            <div className="modal-description">
              Please sign in to manage your trackers
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
    <div className="tracker-management-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <Card className="tracker-management-modal">
        <Flex direction="column">
          
          {/* Header */}
          <div className="modal-header">
            <div className="modal-title">
              📍 Tracker Management
            </div>
            <div className="modal-description">
              Create and manage Amazon Location Service trackers
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
                {editingTracker ? `Edit Tracker: ${editingTracker.name}` : "Create New Tracker"}
              </Text>
              
              <div className="form-row">
                <TextField
                  label="Tracker ID *"
                  value={formData.trackerId}
                  onChange={(e) => setFormData({...formData, trackerId: e.target.value})}
                  placeholder="e.g. my-tracker-001"
                  isRequired
                  isDisabled={loading || !!editingTracker}
                  descriptiveText="Unique identifier for the tracker"
                />
                <TextField
                  label="Tracker Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter tracker name"
                  isRequired
                  isDisabled={loading}
                />
              </div>
              
              <div className="form-row">
                <SelectField
                  label="AWS Region *"
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                  isDisabled={loading}
                >
                  <option value="eu-west-1">EU West 1 (Ireland)</option>
                  <option value="us-east-1">US East 1 (N. Virginia)</option>
                  <option value="us-west-2">US West 2 (Oregon)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                </SelectField>
                <SelectField
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  isDisabled={loading}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="CREATING">Creating</option>
                  <option value="DELETING">Deleting</option>
                </SelectField>
              </div>
              
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter tracker description"
                isDisabled={loading}
              />
              
              <div className="form-row">
                <TextField
                  label="KMS Key ID"
                  value={formData.kmsKeyId}
                  onChange={(e) => setFormData({...formData, kmsKeyId: e.target.value})}
                  placeholder="arn:aws:kms:region:account:key/key-id"
                  isDisabled={loading}
                  descriptiveText="Optional: KMS key for encryption"
                />
              </div>
              
              <TextAreaField
                label="Tags (JSON)"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder='{"environment": "production", "team": "logistics"}'
                isDisabled={loading}
                rows={3}
                descriptiveText="Optional: JSON object for metadata tags"
              />
              
              <TextAreaField
                label="Event Filtering (JSON)"
                value={formData.eventFiltering}
                onChange={(e) => setFormData({...formData, eventFiltering: e.target.value})}
                placeholder='{"type": "POSITION_UPDATE", "enabled": true}'
                isDisabled={loading}
                rows={3}
                descriptiveText="Optional: JSON configuration for event filtering"
              />
              
              <div className="form-actions">
                <Button 
                  type="submit"
                  variation="primary" 
                  isLoading={loading}
                  loadingText={editingTracker ? "Updating..." : "Creating..."}
                  isFullWidth
                  size="large"
                >
                  {editingTracker ? "Update Tracker" : "Create Tracker"}
                </Button>
                
                <Flex direction="row" gap="0.5rem" justifyContent="center" marginTop="0.75rem">
                  {editingTracker && (
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
                    onClick={loadTrackers}
                    isDisabled={loading}
                  >
                    🔄 Refresh
                  </Button>
                </Flex>
              </div>
            </form>
          </div>

          <Divider />

          {/* Trackers Table */}
          <div className="trackers-section">
            <Text className="section-title" marginBottom="1rem">
              Your Trackers ({trackers.length})
            </Text>
            
            {loading && trackers.length === 0 ? (
              <div className="empty-state">
                <Text>Loading trackers...</Text>
              </div>
            ) : trackers.length === 0 ? (
              <div className="empty-state">
                <Text color="gray">
                  No trackers found. Create your first tracker above.
                </Text>
              </div>
            ) : (
              <div className="table-container">
                <Table className="trackers-table">
                  <TableHead>
                    <TableRow>
                      <TableCell as="th">Name</TableCell>
                      <TableCell as="th">Tracker ID</TableCell>
                      <TableCell as="th">Region</TableCell>
                      <TableCell as="th">Status</TableCell>
                      <TableCell as="th">Created</TableCell>
                      <TableCell as="th">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trackers.map((tracker) => (
                      <TableRow key={tracker.id}>
                        <TableCell>
                          <View>
                            <Text fontWeight="bold">{tracker.name}</Text>
                            {tracker.description && (
                              <Text fontSize="0.75rem" color="gray">
                                {tracker.description}
                              </Text>
                            )}
                          </View>
                        </TableCell>
                        <TableCell>
                          <Text fontFamily="monospace" fontSize="0.875rem">
                            {tracker.trackerId}
                          </Text>
                        </TableCell>
                        <TableCell>{tracker.region}</TableCell>
                        <TableCell>
                          {getStatusBadge(tracker.status || 'INACTIVE')}
                        </TableCell>
                        <TableCell>
                          <Text fontSize="0.875rem">
                            {formatDate(tracker.createdAt || undefined)}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Flex direction="row" gap="0.25rem" wrap="wrap">
                            <Button 
                              size="small" 
                              variation="primary"
                              onClick={() => handleEdit(tracker)}
                              isDisabled={loading}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="small" 
                              variation={tracker.status === 'ACTIVE' ? "warning" : "primary"}
                              onClick={() => toggleStatus(tracker)}
                              isDisabled={loading}
                            >
                              {tracker.status === 'ACTIVE' ? "Disable" : "Enable"}
                            </Button>
                            <Button 
                              size="small" 
                              variation="destructive"
                              onClick={() => handleDelete(tracker)}
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

export { TrackerManagement }; 