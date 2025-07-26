/* Secure Client Hook - Gradual migration to secure clients */

import { useMemo } from "react";
import { LocationClientConfig } from "@aws/amazon-location-utilities-auth-helper";
import { CognitoIdentityCredentials } from "@demo/types";
import { secureClientService } from "@demo/services/SecureClientService";
import useClientService from "@demo/services/useClientService";

/**
 * Feature flag for gradual security rollout
 * Set to true to enable security monitoring (non-breaking)
 */
const ENABLE_SECURITY_MONITORING = true;

/**
 * Hook that provides either secure or original clients based on feature flag
 * NON-BREAKING: Can be toggled on/off without affecting functionality
 */
const useSecureClient = () => {
  const originalClientService = useClientService();
  
  return useMemo(() => {
    if (ENABLE_SECURITY_MONITORING) {
      return {
        createPlacesClient: (config: LocationClientConfig) => 
          secureClientService.createPlacesClient(config),
        createRoutesClient: (config: LocationClientConfig) => 
          secureClientService.createRoutesClient(config),
        createLocationClient: (credentials: CognitoIdentityCredentials, region: string) => 
          secureClientService.createLocationClient(credentials, region),
        createIotClient: (credentials: CognitoIdentityCredentials, region: string) => 
          secureClientService.createIotClient(credentials, region)
      };
    }
    
    // Fallback to original clients if security monitoring is disabled
    return originalClientService;
  }, [originalClientService]);
};

export default useSecureClient;