/* Secure Client Service - Wraps AWS clients with security monitoring */

import { LocationClientConfig } from "@aws/amazon-location-utilities-auth-helper";
import { GeoPlacesClient } from "@aws-sdk/client-geo-places";
import { GeoRoutesClient } from "@aws-sdk/client-geo-routes";
import { IoT } from "@aws-sdk/client-iot";
import { Location } from "@aws-sdk/client-location";
import { CognitoIdentityCredentials } from "@demo/types";
import { securityService } from "./SecurityService";

/**
 * Secure wrapper for AWS clients that adds monitoring and rate limiting
 * NON-BREAKING: Maintains same interface as original useClientService
 */
class SecureClientService {
  /**
   * Create secure GeoPlaces client with monitoring
   */
  createPlacesClient(locationClientConfig: LocationClientConfig): GeoPlacesClient {
    const client = new GeoPlacesClient(locationClientConfig);
    
    // Wrap the send method to add security monitoring
    const originalSend = client.send.bind(client);
    client.send = async (command: any, options?: any) => {
      // Check rate limits (non-blocking for now)
      securityService.checkRateLimit('location');
      
      try {
        const result = await originalSend(command, options);
        securityService.trackAPIUsage('location', command.constructor.name, true);
        return result;
      } catch (error) {
        securityService.trackAPIUsage('location', command.constructor.name, false);
        throw error;
      }
    };
    
    return client;
  }

  /**
   * Create secure GeoRoutes client with monitoring
   */
  createRoutesClient(locationClientConfig: LocationClientConfig): GeoRoutesClient {
    const client = new GeoRoutesClient(locationClientConfig);
    
    const originalSend = client.send.bind(client);
    client.send = async (command: any, options?: any) => {
      securityService.checkRateLimit('location');
      
      try {
        const result = await originalSend(command, options);
        securityService.trackAPIUsage('location', command.constructor.name, true);
        return result;
      } catch (error) {
        securityService.trackAPIUsage('location', command.constructor.name, false);
        throw error;
      }
    };
    
    return client;
  }

  /**
   * Create secure Location client with monitoring
   */
  createLocationClient(credentials: CognitoIdentityCredentials, region: string): Location {
    const client = new Location({ credentials, region });
    
    const originalSend = client.send.bind(client);
    client.send = async (command: any, options?: any) => {
      securityService.checkRateLimit('location');
      
      try {
        const result = await originalSend(command, options);
        securityService.trackAPIUsage('location', command.constructor.name, true);
        return result;
      } catch (error) {
        securityService.trackAPIUsage('location', command.constructor.name, false);
        throw error;
      }
    };
    
    return client;
  }

  /**
   * Create secure IoT client with enhanced monitoring
   */
  createIotClient(credentials: CognitoIdentityCredentials, region: string): IoT {
    const client = new IoT({ credentials, region });
    
    const originalSend = client.send.bind(client);
    client.send = async (command: any, options?: any) => {
      securityService.checkRateLimit('iot');
      
      // Special validation for IoT operations
      if (command.constructor.name.includes('AttachPolicy') || 
          command.constructor.name.includes('DetachPolicy')) {
        console.warn('[SECURITY] Potentially dangerous IoT operation attempted:', command.constructor.name);
        securityService.trackAPIUsage('iot', command.constructor.name + '_DANGEROUS', false);
      }
      
      try {
        const result = await originalSend(command, options);
        securityService.trackAPIUsage('iot', command.constructor.name, true);
        return result;
      } catch (error) {
        securityService.trackAPIUsage('iot', command.constructor.name, false);
        throw error;
      }
    };
    
    return client;
  }
}

export const secureClientService = new SecureClientService();