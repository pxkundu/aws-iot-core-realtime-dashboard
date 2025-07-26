/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { showToast } from "@demo/core/Toast";
import { useAuth, useGeofence } from "@demo/hooks";
import i18n from "@demo/locales/i18n";
import { EventTypeEnum, MqttConnectionState, NotificationHistoryItemtype, ToastType } from "@demo/types";
import { record } from "@demo/utils/analyticsUtils";
import { getDomainName } from "@demo/utils/getDomainName";
import { iot, mqtt } from "aws-iot-device-sdk-v2";
import { equals } from "ramda";

const unauthEvents: unknown[] = [];
const { CLOSED, CONNECT, CONNECTION_FAILURE, CONNECTION_SUCCESS, DISCONNECT, ERROR, INTERRUPT, RESUME } =
  MqttConnectionState;

// Reconnection configuration
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds

const useWebSocketService = (
  updateTrackingHistory?: (n: NotificationHistoryItemtype) => void,
  startSocketConnection = true
): { connectionState: MqttConnectionState } => {
  const [mqttClient, setMqttClient] = useState<mqtt.MqttClientConnection | null>(null);
  const [connectionState, setConnectionState] = useState<MqttConnectionState>(CLOSED);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const areEventListenersSet = useRef(false);
  const { baseValues, credentials, fetchCredentials } = useAuth();
  const { setUnauthNotifications } = useGeofence();

  // Calculate exponential backoff delay
  const getRetryDelay = useCallback((attempt: number): number => {
    const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }, []);

  // Check if credentials are expired or about to expire
  const areCredentialsExpired = useCallback((): boolean => {
    if (!credentials?.expiration) return true;
    
    const now = new Date();
    const expirationTime = new Date(credentials.expiration);
    const timeUntilExpiry = expirationTime.getTime() - now.getTime();
    
    // Consider credentials expired if they expire within the next 5 minutes
    return timeUntilExpiry <= 5 * 60 * 1000;
  }, [credentials]);

  // Refresh credentials if needed
  const refreshCredentialsIfNeeded = useCallback(async (): Promise<boolean> => {
    try {
      if (areCredentialsExpired()) {
        console.log("🔄 Refreshing expired AWS credentials for WebSocket connection");
        await fetchCredentials();
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Failed to refresh credentials:", error);
      showToast({
        content: i18n.t("show_toast__failed_refresh_credentials.text") || "Failed to refresh credentials",
        type: ToastType.ERROR
      });
      return false;
    }
  }, [areCredentialsExpired, fetchCredentials]);

  /* Terminate connection and subscription on unmount */
  useEffect(() => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    if (reconnectTimeoutId.current) clearTimeout(reconnectTimeoutId.current);

    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
      if (reconnectTimeoutId.current) clearTimeout(reconnectTimeoutId.current);

      timeoutId.current = setTimeout(async () => {
        if (mqttClient) {
          try {
            await mqttClient.unsubscribe(`${credentials!.identityId}/tracker`);
            await mqttClient.disconnect();
            mqttClient.removeAllListeners();
            setMqttClient(null);
            areEventListenersSet.current = false;
            console.log("🔌 WebSocket connection cleaned up");
          } catch (error) {
            console.error("❌ Error during cleanup:", error);
          }
        }
      }, 1000);
    };
  }, [mqttClient, credentials]);

  /* Setup listeners */
  useEffect(() => {
    if (mqttClient && !areEventListenersSet.current) {
      areEventListenersSet.current = true;

      mqttClient.setMaxListeners(8);

      mqttClient.on(CLOSED, () => {
        console.info("📡 WebSocket CLOSED");
        setConnectionState(CLOSED);
      });

      mqttClient.on(CONNECT, () => {
        console.info("🔗 WebSocket CONNECT");
        setConnectionState(CONNECT);
      });

      mqttClient.on(CONNECTION_FAILURE, error => {
        console.error("❌ WebSocket CONNECTION_FAILURE:", error);
        setConnectionState(CONNECTION_FAILURE);
        
        // Check if this might be a credential issue
        if (areCredentialsExpired()) {
          console.warn("⚠️ Connection failure detected with expired credentials");
        }
      });

      mqttClient.on(CONNECTION_SUCCESS, () => {
        console.info("✅ WebSocket CONNECTION_SUCCESS");
        setConnectionState(CONNECTION_SUCCESS);
        setReconnectAttempts(0); // Reset reconnect attempts on successful connection
      });

      mqttClient.on(DISCONNECT, () => {
        console.info("🔌 WebSocket DISCONNECT");
        setConnectionState(DISCONNECT);
      });

      mqttClient.on(ERROR, error => {
        console.error("❌ WebSocket ERROR:", { error });
        setConnectionState(ERROR);
      });

      mqttClient.on(INTERRUPT, () => {
        console.info("⏸️ WebSocket INTERRUPT");
        setConnectionState(INTERRUPT);
      });

      mqttClient.on(RESUME, () => {
        console.info("▶️ WebSocket RESUME");
        setConnectionState(RESUME);
        setReconnectAttempts(0); // Reset reconnect attempts on resume
      });
    }
  }, [mqttClient, connectionState, areCredentialsExpired]);

  const config = useMemo(() => {
    if (!baseValues || !credentials) return null;
    
    return iot.AwsIotMqttConnectionConfigBuilder.new_with_websockets()
      .with_clean_session(false)
      .with_client_id(credentials.identityId)
      .with_endpoint(getDomainName(baseValues.webSocketUrl))
      .with_credentials(
        baseValues.region,
        credentials.accessKeyId,
        credentials.secretAccessKey,
        credentials.sessionToken
      );
  }, [baseValues, credentials]);

  const connectAndSubscribe = useCallback(async () => {
    if (!config || !baseValues || !credentials) {
      console.error("❌ Missing config, baseValues, or credentials for WebSocket connection");
      return;
    }

    if (mqttClient) {
      console.log("⚠️ MQTT client already exists, skipping connection");
      return;
    }

    try {
      console.log("🔄 Creating new WebSocket connection to AWS IoT Core");
      const client = new mqtt.MqttClient().new_connection(config.build());
      setMqttClient(client);
      
      await client.connect();
      console.log("✅ WebSocket connected successfully");
      
      await client.subscribe(`${credentials.identityId}/tracker`, mqtt.QoS.AtMostOnce, (_, payload) => {
        try {
          const data = JSON.parse(new TextDecoder("utf-8").decode(payload));
          const {
            eventTime = "",
            source = "",
            trackerEventType = "",
            geofenceId = "",
            geofenceCollection = "",
            stopName = "",
            coordinates = []
          } = data;

          if (source === "aws.geo") {
            if (stopName) {
              /* Unauth simulation events */
              const unauthEvent = { ...data };
              const busRouteId = geofenceId.split("-")[0];

              if (trackerEventType === "ENTER") {
                updateTrackingHistory &&
                  updateTrackingHistory({
                    busRouteId,
                    geofenceCollection,
                    stopName,
                    coordinates: `${coordinates[1]}, ${coordinates[0]}`,
                    createdAt: eventTime
                  });
              }

              if (unauthEvents.length === 0 || !unauthEvents.some(equals(unauthEvent))) {
                setUnauthNotifications({
                  busRouteId,
                  geofenceCollection,
                  stopName,
                  coordinates: `${coordinates[1]}, ${coordinates[0]}`,
                  createdAt: eventTime,
                  eventType: trackerEventType === "ENTER" ? "Entered" : "Exited"
                });
                unauthEvents.push(unauthEvent);
              }

              showToast({
                content:
                  i18n.dir() === "ltr"
                    ? `Bus ${busRouteId.split("_")[2]}: ${
                        trackerEventType === "ENTER"
                          ? i18n.t("show_toast__entered.text")
                          : i18n.t("show_toast__exited.text")
                      } ${stopName}`
                    : `${stopName} ${
                        trackerEventType === "ENTER"
                          ? i18n.t("show_toast__entered.text")
                          : i18n.t("show_toast__exited.text")
                      } :${busRouteId.split("_")[2]} Bus`,
                type: ToastType.INFO,
                className: `${String(trackerEventType).toLowerCase()}-geofence`
              });
            }

            record(
              [
                {
                  EventType: EventTypeEnum.GEO_EVENT_TRIGGERED,
                  Attributes: {
                    eventType: trackerEventType,
                    geofenceId
                  }
                }
              ],
              ["userAWSAccountConnectionStatus", "userAuthenticationStatus"]
            );
          }
        } catch (error) {
          console.error("❌ Error processing WebSocket message:", error);
        }
      });
      
      console.log("✅ Successfully subscribed to tracker topic");
    } catch (error) {
      console.error("❌ Error connecting and subscribing to WebSocket:", { error });
      setMqttClient(null);
      throw error;
    }
  }, [config, baseValues, credentials, mqttClient, updateTrackingHistory, setUnauthNotifications]);

  // Enhanced reconnection logic with credential refresh
  const attemptReconnection = useCallback(async () => {
    if (!startSocketConnection) return;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error("❌ Max reconnection attempts reached, giving up");
      showToast({
        content: i18n.t("show_toast__websocket_reconnect_failed.text") || "Failed to reconnect to notification service",
        type: ToastType.ERROR
      });
      return;
    }

    const delay = getRetryDelay(reconnectAttempts);
    console.log(`🔄 Attempting WebSocket reconnection ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
    
    setReconnectAttempts(prev => prev + 1);
    
    reconnectTimeoutId.current = setTimeout(async () => {
      try {
        // Refresh credentials if they're expired
        await refreshCredentialsIfNeeded();
        
        // Clean up existing client
        if (mqttClient) {
          try {
            await mqttClient.disconnect();
            mqttClient.removeAllListeners();
          } catch (error) {
            console.warn("⚠️ Error cleaning up old client:", error);
          }
          setMqttClient(null);
          areEventListenersSet.current = false;
        }
        
        // Attempt new connection
        await connectAndSubscribe();
      } catch (error) {
        console.error("❌ Reconnection attempt failed:", error);
        // The useEffect will trigger another reconnection attempt
      }
    }, delay);
  }, [
    startSocketConnection,
    reconnectAttempts,
    getRetryDelay,
    refreshCredentialsIfNeeded,
    mqttClient,
    connectAndSubscribe
  ]);

  /* Initiate connection and subscription accordingly */
  useEffect(() => {
    if (
      startSocketConnection &&
      !mqttClient &&
      [CLOSED, CONNECTION_FAILURE, DISCONNECT, ERROR, INTERRUPT].includes(connectionState)
    ) {
      // For initial connection or immediate failures, try connecting without delay
      if (connectionState === CLOSED || reconnectAttempts === 0) {
        connectAndSubscribe().catch(() => {
          // If initial connection fails, start the reconnection process
          attemptReconnection();
        });
      } else {
        // For subsequent failures, use the reconnection logic with backoff
        attemptReconnection();
      }
    }
  }, [connectionState, connectAndSubscribe, mqttClient, startSocketConnection, reconnectAttempts, attemptReconnection]);

  // Reset reconnect attempts when credentials change
  useEffect(() => {
    setReconnectAttempts(0);
  }, [credentials]);

  return useMemo(
    () => ({
      connectionState
    }),
    [connectionState]
  );
};

export default useWebSocketService;
