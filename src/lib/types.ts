// ===== Database Row Types =====

export interface Schedule {
  id: number;
  title: string;
  type: 'school' | 'academy';
  schedule_type: 'regular' | 'makeup';
  day_of_week: number; // 0=Sunday, 1=Monday ... 6=Saturday
  start_time: string;  // "HH:MM" 24h format
  end_time: string;    // "HH:MM" 24h format
  location: string | null;
  color: string;       // hex color e.g. "#3B82F6"
  notes: string | null;
  is_active: number;   // 1=active, 0=paused
  created_at: string;
  updated_at: string;
}

export interface NotificationRule {
  id: number;
  schedule_id: number;
  minutes_before: number;
  message_template: string;
  is_active: number;
  created_at: string;
}

export interface NotificationLog {
  id: number;
  notification_rule_id: number;
  schedule_id: number;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  error_message: string | null;
  sent_at: string;
}

export interface KakaoTokens {
  id: number;
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
  refresh_expires_at: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: string;
}

// ===== API Request/Response Types =====

export interface CreateScheduleRequest {
  title: string;
  type: 'school' | 'academy';
  schedule_type?: 'regular' | 'makeup';
  day_of_week: number;
  start_time: string;
  end_time: string;
  location?: string;
  color?: string;
  notes?: string;
  notification?: {
    minutes_before: number;
    message_template: string;
  };
}

export interface UpdateScheduleRequest extends Partial<CreateScheduleRequest> {
  is_active?: number;
}

export interface CreateNotificationRuleRequest {
  schedule_id: number;
  minutes_before: number;
  message_template: string;
}

// ===== Joined Query Types =====

export interface ScheduleWithNotifications extends Schedule {
  notification_rules: NotificationRule[];
}

export interface PendingNotification {
  rule_id: number;
  schedule_id: number;
  title: string;
  location: string | null;
  minutes_before: number;
  message_template: string;
}

// ===== UI Types =====

export const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'] as const;

export const SCHEDULE_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
] as const;
