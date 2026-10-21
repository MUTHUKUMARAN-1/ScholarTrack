export type NoticeStatus = 'verified' | 'unverified' | 'stale' | 'withdrawn';

export interface Notice {
  id: number;
  source_id: number;
  canonical_url: string;
  title: string;
  provider: string;
  notice_type: string;
  education_level: string;
  discipline: string;
  region: string;
  benefit_text?: string;
  eligibility_text?: string;
  eligibility_tags?: string[];
  deadline?: string | null;
  timezone: string;
  deadline_raw_text?: string;
  capture_timestamp: string;
  verification_timestamp?: string | null;
  content_hash: string;
  notice_status: NoticeStatus;
  excerpt?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  source_name?: string;
  source_last_checked?: string | null;
  is_closing_soon?: boolean;
  days_remaining?: number | null;
}

export interface ChangeHistoryItem {
  id: number;
  previous_deadline?: string | null;
  updated_deadline?: string | null;
  changed_fields: Record<string, any>;
  detected_timestamp: string;
  source_reference?: string;
}

export interface NoticeDetail extends Notice {
  change_history_count: number;
  change_history: ChangeHistoryItem[];
}

export interface DashboardStats {
  total_opportunities: number;
  upcoming_deadlines: number;
  closing_soon: number;
  recently_updated: number;
  verified_count: number;
  unverified_count: number;
  stale_count: number;
  withdrawn_count: number;
  sources_count: number;
  last_collection_timestamp?: string | null;
}

export interface Source {
  id: number;
  slug: string;
  name: string;
  official_url: string;
  source_type: string;
  permission_status: string;
  enabled_status: boolean;
  last_checked?: string | null;
  last_status: 'pending' | 'success' | 'error' | 'partial_failure';
  last_error?: string | null;
  records_count: number;
  created_at: string;
  updated_at: string;
}

export interface AlertItem {
  id: number;
  notice_id: number;
  change_id?: number | null;
  alert_type: string;
  title: string;
  message: string;
  deduplication_key: string;
  is_read: boolean;
  creation_timestamp: string;
  notice_title?: string;
  canonical_url?: string;
}

export interface CollectionRun {
  id: number;
  source_id: number;
  source_name?: string;
  start_time: string;
  completion_time?: string | null;
  status: 'running' | 'success' | 'failed' | 'partial_failure';
  records_processed: number;
  records_added: number;
  records_updated: number;
  diagnostic_info?: string | null;
}

export interface AuditLogItem {
  id: number;
  user_id?: number | null;
  username: string;
  action: string;
  target_entity: string;
  target_id?: number | null;
  details?: string | null;
  timestamp: string;
}

export interface EligibilityMatchResult {
  notice_id: number;
  notice_title: string;
  match_score: number;
  matched_criteria: string[];
  potential_conflicts: string[];
  disclaimer: string;
}
