/* Security Service - Rate limiting and monitoring wrapper */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  service: string;
}

interface SecurityMetrics {
  requestCount: number;
  lastReset: number;
  blocked: number;
}

class SecurityService {
  private metrics: Map<string, SecurityMetrics> = new Map();
  private readonly configs: Map<string, RateLimitConfig> = new Map([
    ['location', { maxRequests: 100, windowMs: 60000, service: 'Location Service' }], // 100/min
    ['iot', { maxRequests: 50, windowMs: 60000, service: 'IoT Core' }], // 50/min
    ['pinpoint', { maxRequests: 20, windowMs: 60000, service: 'Pinpoint' }], // 20/min
  ]);

  private getMetrics(service: string): SecurityMetrics {
    if (!this.metrics.has(service)) {
      this.metrics.set(service, {
        requestCount: 0,
        lastReset: Date.now(),
        blocked: 0
      });
    }
    return this.metrics.get(service)!;
  }

  private resetIfNeeded(service: string, config: RateLimitConfig): void {
    const metrics = this.getMetrics(service);
    const now = Date.now();
    
    if (now - metrics.lastReset > config.windowMs) {
      metrics.requestCount = 0;
      metrics.lastReset = now;
    }
  }

  /**
   * Check if request is allowed under rate limits
   * NON-BREAKING: Always allows requests, just logs violations
   */
  public checkRateLimit(service: string): boolean {
    const config = this.configs.get(service);
    if (!config) return true; // Allow unknown services

    this.resetIfNeeded(service, config);
    const metrics = this.getMetrics(service);
    
    metrics.requestCount++;

    if (metrics.requestCount > config.maxRequests) {
      metrics.blocked++;
      
      // Log security event (non-blocking)
      console.warn(`[SECURITY] Rate limit exceeded for ${config.service}`, {
        service,
        count: metrics.requestCount,
        limit: config.maxRequests,
        blocked: metrics.blocked
      });

      // Send to monitoring (non-blocking)
      this.reportSecurityEvent('rate_limit_exceeded', {
        service: config.service,
        count: metrics.requestCount,
        limit: config.maxRequests
      });

      // For now, still allow the request (non-breaking)
      // TODO: In Phase 2, actually block the request
      return true;
    }

    return true;
  }

  /**
   * Validate IoT topic access
   * NON-BREAKING: Logs violations but allows access
   */
  public validateIoTAccess(topic: string, identityId: string): boolean {
    // Check if topic follows security pattern
    const allowedPattern = new RegExp(`^demo/${identityId}/`);
    
    if (!allowedPattern.test(topic)) {
      console.warn('[SECURITY] IoT topic access violation', {
        topic,
        identityId,
        expected: `demo/${identityId}/*`
      });

      this.reportSecurityEvent('iot_topic_violation', {
        topic,
        identityId
      });

      // For now, still allow (non-breaking)
      // TODO: In Phase 2, block unauthorized topics
      return true;
    }

    return true;
  }

  /**
   * Monitor API usage patterns
   */
  public trackAPIUsage(service: string, operation: string, success: boolean): void {
    const key = `${service}_${operation}`;
    const metrics = this.getMetrics(key);
    
    if (success) {
      metrics.requestCount++;
    } else {
      // Track failures for potential abuse detection
      console.warn('[SECURITY] API operation failed', {
        service,
        operation,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Report security events (non-blocking)
   */
  private reportSecurityEvent(eventType: string, details: any): void {
    try {
      // Send to CloudWatch or external monitoring
      // This is non-blocking and won't affect app functionality
      if (window.navigator.sendBeacon) {
        const payload = JSON.stringify({
          eventType,
          details,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });
        
        // Send to monitoring endpoint (if available)
        window.navigator.sendBeacon('/api/security-events', payload);
      }
    } catch (error) {
      // Silently fail - don't break app functionality
      console.debug('Security event reporting failed:', error);
    }
  }

  /**
   * Get current security metrics (for debugging)
   */
  public getSecurityMetrics(): Record<string, SecurityMetrics> {
    const result: Record<string, SecurityMetrics> = {};
    this.metrics.forEach((metrics, service) => {
      result[service] = { ...metrics };
    });
    return result;
  }
}

export const securityService = new SecurityService();