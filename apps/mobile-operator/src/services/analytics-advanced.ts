// TODO: Analytics avanzado con cohortes y funnels - Player 3 (Fullstack)
// Paso 1: Enhanced event tracking
// Paso 2: User segments
// Paso 3: Attribution tracking
// Prompt de implementación rápida:
// "Crear analytics avanzado con events, segments, attribution"
// Entregable:
// - trackEvent con props
// - setUserProperties
// - Funnel tracking
import { auth } from '../services/firebase';
import { getAnalytics, logEvent, setUserProperties, setUserId } from 'firebase/analytics';

const analytics = typeof window !== 'undefined' ? getAnalytics() : null;

interface EventProps {
  [key: string]: any;
}

export class AdvancedAnalytics {
  private analyticsInstance: ReturnType<typeof getAnalytics> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.analyticsInstance = getAnalytics();
    }
  }

  // Track custom event
  async trackEvent(eventName: string, props?: EventProps) {
    if (!this.analyticsInstance) return;

    try {
      await logEvent(this.analyticsInstance, eventName, props);
      console.log(`📊 Event tracked: ${eventName}`, props);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Track screen view
  async trackScreenView(screenName: string, params?: EventProps) {
    await this.trackEvent('screen_view', {
      screen_name: screenName,
      ...params,
    });
  }

  // Track user engagement
  async trackEngagement(type: string, metadata?: EventProps) {
    await this.trackEvent('user_engagement', {
      engagement_type: type,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  // Track conversion
  async trackConversion(conversionName: string, value?: number) {
    await this.trackEvent('conversion', {
      conversion_name: conversionName,
      value: value || 0,
      currency: 'USD',
      timestamp: Date.now(),
    });
  }

  // Set user properties
  async setUserProperties(properties: Record<string, string | number | boolean>) {
    if (!this.analyticsInstance) return;

    try {
      await setUserProperties(this.analyticsInstance, properties);
      console.log('📊 User properties set:', properties);
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  // Set user ID
  async setUserId(userId?: string) {
    if (!this.analyticsInstance) return;
    await setUserId(this.analyticsInstance, userId || null);
  }

  // Track funnel step
  async trackFunnelStep(funnelName: string, stepNumber: number, stepName: string) {
    await this.trackEvent('funnel_step', {
      funnel_name: funnelName,
      step_number: stepNumber,
      step_name: stepName,
      timestamp: Date.now(),
    });
  }

  // Track funnel completion
  async trackFunnelComplete(funnelName: string, duration: number) {
    await this.trackEvent('funnel_complete', {
      funnel_name: funnelName,
      duration_ms: duration,
      timestamp: Date.now(),
    });
  }

  // Track error
  async trackError(error: Error, context?: EventProps) {
    await this.trackEvent('error', {
      error_name: error.name,
      error_message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  // Track performance
  async trackPerformance(metricName: string, duration: number, metadata?: EventProps) {
    await this.trackEvent('performance_metric', {
      metric_name: metricName,
      duration_ms: duration,
      ...metadata,
    });
  }

  // Reset analytics
  async reset() {
    if (!this.analyticsInstance) return;
    await setUserId(this.analyticsInstance, null);
    await setUserProperties(this.analyticsInstance, {});
  }
}

export const advancedAnalytics = new AdvancedAnalytics();

// Predefined events
export const EVENTS = {
  // User
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',

  // Evaluation
  CREATE_EVALUATION: 'create_evaluation',
  SUBMIT_EVALUATION: 'submit_evaluation',
  SAVE_DRAFT: 'save_draft',

  // Approval
  APPROVE_EVALUATION: 'approve_evaluation',
  REJECT_EVALUATION: 'reject_evaluation',

  // Export
  EXPORT_PDF: 'export_pdf',
  EXPORT_EXCEL: 'export_excel',

  // Offline
  OFFLINE_MODE: 'offline_mode',
  ONLINE_SYNC: 'online_sync',

  // GPS
  GPS_ENABLED: 'gps_enabled',
  GPS_DISABLED: 'gps_disabled',
  LOCATION_UPDATED: 'location_updated',

  // Photo
  PHOTO_TAKEN: 'photo_taken',
  PHOTO_UPLOADED: 'photo_uploaded',
} as const;
