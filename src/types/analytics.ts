export interface RiskInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: string;
  recommendation: string;
  affectedControls: string[];
  metadata: Record<string, any>;
}

export interface MaturityTrend {
  domain: string;
  current: number;
  previous: number;
  trend: 'improving' | 'declining' | 'stable';
  velocity: number; // Rate of change
}

export interface RiskPrediction {
  domain: string;
  currentRisk: 'low' | 'medium' | 'high' | 'critical';
  predictedRisk: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  confidence: number;
  factors: string[];
}

export interface NotificationData {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  organizationId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface CreateNotificationData {
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface GridColumns {
  mobile?: number;
  tablet?: number;
  desktop?: number;
}