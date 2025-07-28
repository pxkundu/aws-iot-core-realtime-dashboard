/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { FC, useState } from "react";
import { Flex, View, Button, TextField, Text, SelectField, TextAreaField } from "@aws-amplify/ui-react";
import "./styles.scss";

interface IoTGeofencesProps {
  onClose?: () => void;
}

export const IoTGeofences: FC<IoTGeofencesProps> = ({ onClose }) => {
  const [geofences, setGeofences] = useState([
    { 
      id: "geo-1", 
      name: "Warehouse Zone", 
      type: "Polygon", 
      status: "Active", 
      devices: 3,
      coordinates: "37.7749,-122.4194 37.7849,-122.4094 37.7649,-122.4294"
    },
    { 
      id: "geo-2", 
      name: "Delivery Area", 
      type: "Circle", 
      status: "Active", 
      devices: 2,
      coordinates: "37.7849,-122.4094 (500m radius)"
    }
  ]);
  
  const [newGeofence, setNewGeofence] = useState({
    name: "",
    type: "Polygon",
    coordinates: "",
    description: ""
  });

  const handleCreateGeofence = () => {
    if (newGeofence.name && newGeofence.coordinates) {
      const geofence = {
        id: `geo-${Date.now()}`,
        name: newGeofence.name,
        type: newGeofence.type,
        status: "Active",
        devices: 0,
        coordinates: newGeofence.coordinates
      };
      setGeofences([...geofences, geofence]);
      setNewGeofence({ name: "", type: "Polygon", coordinates: "", description: "" });
    }
  };

  const handleDeleteGeofence = (geofenceId: string) => {
    setGeofences(geofences.filter(geofence => geofence.id !== geofenceId));
  };

  const toggleGeofenceStatus = (geofenceId: string) => {
    setGeofences(geofences.map(geofence => 
      geofence.id === geofenceId 
        ? { ...geofence, status: geofence.status === "Active" ? "Inactive" : "Active" }
        : geofence
    ));
  };

  return (
    <View className="iot-geofences">
      <Flex direction="column" gap="1rem">
        <Text variation="primary" fontSize="1.25rem" fontWeight="bold">
          Geofence Management
        </Text>
        
        {/* Create New Geofence */}
        <View className="geofence-form">
          <Text fontWeight="bold" marginBottom="0.5rem">Create New Geofence</Text>
          <Flex direction="column" gap="0.5rem">
            <Flex direction="row" gap="0.5rem" wrap="wrap">
              <TextField
                label="Geofence Name"
                value={newGeofence.name}
                onChange={(e) => setNewGeofence({...newGeofence, name: e.target.value})}
                placeholder="Enter geofence name"
              />
              <SelectField
                label="Geofence Type"
                value={newGeofence.type}
                onChange={(e) => setNewGeofence({...newGeofence, type: e.target.value})}
              >
                <option value="Polygon">Polygon</option>
                <option value="Circle">Circle</option>
                <option value="Rectangle">Rectangle</option>
              </SelectField>
            </Flex>
            <TextAreaField
              label="Coordinates"
              value={newGeofence.coordinates}
              onChange={(e) => setNewGeofence({...newGeofence, coordinates: e.target.value})}
              placeholder="For Polygon: lat1,lng1 lat2,lng2 lat3,lng3... | For Circle: lat,lng (radius)"
              rows={3}
            />
            <TextField
              label="Description (Optional)"
              value={newGeofence.description}
              onChange={(e) => setNewGeofence({...newGeofence, description: e.target.value})}
              placeholder="Enter description"
            />
            <Button variation="primary" onClick={handleCreateGeofence}>
              Create Geofence
            </Button>
          </Flex>
        </View>

        {/* Geofence List */}
        <View className="geofence-list">
          {geofences.map((geofence) => (
            <View key={geofence.id} className="geofence-item">
              <Flex direction="column" gap="0.5rem">
                <Flex direction="row" justifyContent="space-between" alignItems="center">
                  <View>
                    <Text fontWeight="bold">{geofence.name}</Text>
                    <Text fontSize="0.875rem" color="gray">
                      Type: {geofence.type} | Status: 
                      <span className={`status ${geofence.status.toLowerCase()}`}>
                        {geofence.status}
                      </span>
                      | Devices: {geofence.devices}
                    </Text>
                  </View>
                  <Flex direction="row" gap="0.5rem">
                    <Button 
                      size="small" 
                      variation={geofence.status === "Active" ? "warning" : "primary"}
                      onClick={() => toggleGeofenceStatus(geofence.id)}
                    >
                      {geofence.status === "Active" ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="small" variation="primary">
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      variation="destructive"
                      onClick={() => handleDeleteGeofence(geofence.id)}
                    >
                      Delete
                    </Button>
                  </Flex>
                </Flex>
                <View className="coordinates">
                  <Text fontSize="0.75rem" color="gray" fontFamily="monospace">
                    Coordinates: {geofence.coordinates}
                  </Text>
                </View>
              </Flex>
            </View>
          ))}
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