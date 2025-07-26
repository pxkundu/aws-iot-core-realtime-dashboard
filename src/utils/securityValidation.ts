/* Security Validation Utilities */

interface SecurityConfig {
  maxEndpointExposure: boolean;
  validateOrigin: boolean;
  enableRateLimit: boolean;
  logSecurityEvents: boolean;
}

/**
 * Security configuration - can be toggled via environment variables
 */
const getSecurityConfig = (): SecurityConfig => ({
  maxEndpointExposure: process.env.NODE_ENV === 'production',
  validateOrigin: process.env.NODE_ENV === 'production',
  enableRateLimit: true, // Always enabled for monitoring
  logSecurityEvents: true
});

/**
 * Validate environment variables for security issues
 * NON-BREAKING: Only logs warnings, doesn't block execution
 */
export const validateEnvironmentSecurity = (): void => {
  const config = getSecurityConfig();
  const warnings: string[] = [];
  
  // Check for exposed sensitive endpoints
  if (config.maxEndpointExposure) {
    const sensitiveVars = [
      'VITE_IOT_ENDPOINT',
      'VITE_IDENTITY_POOL_ID',
      'VITE_USER_POOL_ID',
      'VITE_PINPOINT_APP_ID'
    ];
    
    sensitiveVars.forEach(varName => {
      const value = import.meta.env[varName];
      if (value && value.length > 20) {
        warnings.push(`${varName} is exposed in client bundle`);
      }
    });
  }
  
  // Validate origin restrictions
  if (config.validateOrigin) {
    const currentOrigin = window.location.origin;
    const allowedOrigins = ['localhost:3000', 'your-domain.com']; // Configure as needed
    
    if (!allowedOrigins.some(origin => currentOrigin.includes(origin))) {
      warnings.push(`Application running on unexpected origin: ${currentOrigin}`);
    }
  }
  
  // Log warnings (non-blocking)
  if (warnings.length > 0 && config.logSecurityEvents) {
    console.group('[SECURITY WARNINGS]');
    warnings.forEach(warning => console.warn(`⚠️  ${warning}`));
    console.groupEnd();
    
    // Report to monitoring (non-blocking)
    reportSecurityWarnings(warnings);
  }
};

/**
 * Validate IoT topic patterns for security
 */
export const validateIoTTopic = (topic: string, identityId: string): boolean => {
  // Expected pattern: demo/{identityId}/*
  // Escape special regex characters in identityId to prevent regex injection
  const escapedIdentityId = identityId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const securePattern = new RegExp(`^demo/${escapedIdentityId}/`);
  
  if (!securePattern.test(topic)) {
    console.warn('[SECURITY] IoT topic does not follow secure pattern', {
      topic,
      expected: `demo/${identityId}/*`,
      identityId
    });
    return false;
  }
  
  return true;
};

/**
 * Check if current session has exceeded usage limits
 */
export const checkUsageLimits = (): { withinLimits: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  
  // Check session duration (prevent long-running sessions)
  const sessionStart = sessionStorage.getItem('session_start');
  if (sessionStart) {
    const sessionDuration = Date.now() - parseInt(sessionStart);
    const maxSessionDuration = 4 * 60 * 60 * 1000; // 4 hours
    
    if (sessionDuration > maxSessionDuration) {
      warnings.push('Session duration exceeds recommended limit');
    }
  } else {
    sessionStorage.setItem('session_start', Date.now().toString());
  }
  
  // Check local storage usage (prevent data accumulation)
  const storageUsage = JSON.stringify(localStorage).length;
  const maxStorageUsage = 1024 * 1024; // 1MB
  
  if (storageUsage > maxStorageUsage) {
    warnings.push('Local storage usage is high');
  }
  
  return {
    withinLimits: warnings.length === 0,
    warnings
  };
};

/**
 * Report security warnings to monitoring (non-blocking)
 */
const reportSecurityWarnings = (warnings: string[]): void => {
  try {
    // Check if sendBeacon is actually supported (not just defined)
    if ('sendBeacon' in navigator && typeof navigator.sendBeacon === 'function') {
      const payload = JSON.stringify({
        type: 'security_warnings',
        warnings,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // This would send to your monitoring endpoint
      // navigator.sendBeacon('/api/security-events', payload);
      
      // For now, just log the payload (remove this in production)
      console.debug('[SECURITY] Would send to monitoring:', payload);
    } else {
      // Fallback for browsers without sendBeacon support
      console.debug('[SECURITY] sendBeacon not supported, using fallback logging');
      console.warn('[SECURITY] Security warnings detected:', warnings);
    }
  } catch (error) {
    // Silently fail - don't break app functionality
    console.debug('Security warning reporting failed:', error);
  }
};

/**
 * Initialize security validation on app start
 * NON-BREAKING: Only performs monitoring, doesn't block execution
 */
export const initializeSecurity = (): void => {
  // Validate environment on startup
  validateEnvironmentSecurity();
  
  // Check usage limits periodically
  const checkInterval = 5 * 60 * 1000; // 5 minutes
  setInterval(() => {
    const { withinLimits, warnings } = checkUsageLimits();
    if (!withinLimits) {
      console.warn('[SECURITY] Usage limit warnings:', warnings);
    }
  }, checkInterval);
  
  // Add global error handler for security events
  window.addEventListener('error', (event) => {
    if (event.error?.message?.includes('AWS') || 
        event.error?.message?.includes('IoT') ||
        event.error?.message?.includes('Location')) {
      console.warn('[SECURITY] AWS service error detected:', event.error.message);
    }
  });
};