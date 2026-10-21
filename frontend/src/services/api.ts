import {
  Notice,
  NoticeDetail,
  DashboardStats,
  Source,
  AlertItem,
  CollectionRun,
  AuditLogItem,
  EligibilityMatchResult
} from '../types';

const API_BASE = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('scholartrack_token');
};

export const setAuthToken = (token: string, username: string, role: string) => {
  localStorage.setItem('scholartrack_token', token);
  localStorage.setItem('scholartrack_username', username);
  localStorage.setItem('scholartrack_role', role);
};

export const clearAuthToken = () => {
  localStorage.removeItem('scholartrack_token');
  localStorage.removeItem('scholartrack_username');
  localStorage.removeItem('scholartrack_role');
};

export const getAuthUser = () => {
  return {
    token: getAuthToken(),
    username: localStorage.getItem('scholartrack_username'),
    role: localStorage.getItem('scholartrack_role'),
  };
};

const authHeaders = () => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// 1. Notices & Stats
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const res = await fetch(`${API_BASE}/notices/stats`);
  if (!res.ok) throw new Error('Failed to load dashboard statistics.');
  return res.json();
};

export interface NoticeQueryParams {
  search?: string;
  provider?: string;
  education_level?: string;
  discipline?: string;
  region?: string;
  notice_type?: string;
  notice_status?: string;
  deadline_status?: string;
  sort_by?: string;
  page?: number;
  page_size?: number;
}

export const fetchNotices = async (params: NoticeQueryParams = {}): Promise<{
  items: Notice[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });

  const res = await fetch(`${API_BASE}/notices?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch scholarship opportunities.');
  return res.json();
};

export const fetchNoticeDetail = async (id: number): Promise<NoticeDetail> => {
  const res = await fetch(`${API_BASE}/notices/${id}`);
  if (!res.ok) throw new Error('Scholarship notice not found.');
  return res.json();
};

export const evaluateNoticeEligibility = async (
  noticeId: number,
  criteria: {
    education_level?: string;
    discipline?: string;
    citizenship?: string;
    study_country_interest?: string;
  }
): Promise<EligibilityMatchResult> => {
  const res = await fetch(`${API_BASE}/notices/${noticeId}/match-eligibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(criteria),
  });
  if (!res.ok) throw new Error('Failed to evaluate eligibility match.');
  return res.json();
};

// 2. Sources & Monitoring
export const fetchSources = async (): Promise<Source[]> => {
  const res = await fetch(`${API_BASE}/sources`);
  if (!res.ok) throw new Error('Failed to fetch sources.');
  return res.json();
};

export const fetchSourceRuns = async (sourceId: number): Promise<CollectionRun[]> => {
  const res = await fetch(`${API_BASE}/sources/${sourceId}/runs`);
  if (!res.ok) throw new Error('Failed to fetch runs.');
  return res.json();
};

// 3. Alerts
export const fetchAlerts = async (alertType?: string): Promise<AlertItem[]> => {
  const url = alertType ? `${API_BASE}/alerts?alert_type=${alertType}` : `${API_BASE}/alerts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch alerts.');
  return res.json();
};

export const markAlertAsRead = async (alertId: number): Promise<AlertItem> => {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/read`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to update alert.');
  return res.json();
};

// 4. Operator Admin API
export const loginOperator = async (username: string, password: string): Promise<{ access_token: string; role: string; username: string }> => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid username or password.');
  const data = await res.json();
  setAuthToken(data.access_token, data.username, data.role);
  return data;
};

export const triggerSourceRefresh = async (sourceId: number, useLiveNetwork = true): Promise<CollectionRun> => {
  const res = await fetch(`${API_BASE}/admin/sources/${sourceId}/refresh?use_live_network=${useLiveNetwork}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to refresh source. Unauthorized or network error.');
  return res.json();
};

export const triggerRefreshAll = async (useLiveNetwork = true): Promise<CollectionRun[]> => {
  const res = await fetch(`${API_BASE}/admin/sources/refresh-all?use_live_network=${useLiveNetwork}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to refresh all sources. Unauthorized.');
  return res.json();
};

export const updateNoticeStatus = async (noticeId: number, status: string, reason?: string): Promise<Notice> => {
  const res = await fetch(`${API_BASE}/admin/notices/${noticeId}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ notice_status: status, reason }),
  });
  if (!res.ok) throw new Error('Failed to update notice status.');
  return res.json();
};

export const manualReviseDeadline = async (noticeId: number, deadline: string | null, reason: string): Promise<Notice> => {
  const res = await fetch(`${API_BASE}/admin/notices/${noticeId}/deadline`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ deadline, reason }),
  });
  if (!res.ok) throw new Error('Failed to revise deadline.');
  return res.json();
};

export const fetchAllRuns = async (): Promise<CollectionRun[]> => {
  const res = await fetch(`${API_BASE}/admin/runs`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch collection runs.');
  return res.json();
};

export const fetchAuditLogs = async (): Promise<AuditLogItem[]> => {
  const res = await fetch(`${API_BASE}/admin/audit-logs`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs.');
  return res.json();
};
