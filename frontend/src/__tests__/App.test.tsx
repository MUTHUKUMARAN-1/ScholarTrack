import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from '../App';
import { StatusBadge } from '../components/StatusBadge';
import { DeadlineBadge } from '../components/DeadlineBadge';

// Mock API calls
vi.mock('../services/api', () => ({
  fetchDashboardStats: vi.fn().mockResolvedValue({
    total_opportunities: 8,
    upcoming_deadlines: 5,
    closing_soon: 2,
    recently_updated: 3,
    verified_count: 6,
    unverified_count: 1,
    stale_count: 1,
    withdrawn_count: 0,
    sources_count: 3,
    last_collection_timestamp: '2026-10-20T12:00:00Z',
  }),
  fetchNotices: vi.fn().mockResolvedValue({
    items: [
      {
        id: 1,
        source_id: 1,
        title: 'Fulbright Study/Research Award - Germany',
        provider: 'U.S. Department of State / IIE',
        canonical_url: 'https://us.fulbrightonline.org/countries/europe-and-eurasia/germany/open-study-research-award',
        notice_type: 'fellowship',
        education_level: "Master's / Doctoral",
        discipline: 'All Fields',
        region: 'Germany',
        deadline: '2026-10-06T17:00:00-04:00',
        timezone: 'America/New_York',
        deadline_raw_text: 'October 6, 2026 5:00 PM Eastern Time',
        notice_status: 'verified',
        is_closing_soon: true,
        days_remaining: 15,
        content_hash: 'abcdef1234567890',
        is_demo: false,
        created_at: '2026-10-20T10:00:00Z',
        updated_at: '2026-10-20T10:00:00Z',
      },
      {
        id: 2,
        source_id: 1,
        title: 'Fulbright-Fogarty Fellowships in Global Health - Rolling Review',
        provider: 'Fulbright / NIH Fogarty',
        canonical_url: 'https://us.fulbrightonline.org/applicants/special-fellowships-rolling',
        notice_type: 'fellowship',
        education_level: 'Doctoral',
        discipline: 'Medicine',
        region: 'International',
        deadline: null, // Unknown/Rolling deadline
        timezone: 'UTC',
        deadline_raw_text: 'Rolling Application',
        notice_status: 'verified',
        is_closing_soon: false,
        days_remaining: null,
        content_hash: '123456abcdef7890',
        is_demo: false,
        created_at: '2026-10-20T10:00:00Z',
        updated_at: '2026-10-20T10:00:00Z',
      },
    ],
    total: 2,
    page: 1,
    page_size: 24,
    total_pages: 1,
  }),
  fetchAlerts: vi.fn().mockResolvedValue([]),
  fetchSources: vi.fn().mockResolvedValue([
    {
      id: 1,
      slug: 'fulbright_student',
      name: 'Fulbright U.S. Student Program',
      official_url: 'https://us.fulbrightonline.org',
      source_type: 'html_catalog',
      permission_status: 'public_allowed',
      enabled_status: true,
      last_status: 'success',
      records_count: 3,
      created_at: '2026-10-20T10:00:00Z',
      updated_at: '2026-10-20T10:00:00Z',
    },
  ]),
}));

describe('ScholarTrack Frontend Application', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with brand, statistics, and navigation', async () => {
    render(<App />);

    expect(screen.getAllByText(/Scholar/i)[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Opportunities/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Total Opportunities')).toBeInTheDocument();
      expect(screen.getAllByText('Upcoming Deadlines').length).toBeGreaterThan(0);
      expect(screen.getByText('Closing Soon')).toBeInTheDocument();
      expect(screen.getByText('Source Freshness')).toBeInTheDocument();
    });
  });

  it('renders official source links for published opportunities', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Fulbright Study/Research Award - Germany')).toBeInTheDocument();
    });

    // Check that official canonical link is present
    const sourceLinks = screen.getAllByRole('link', { name: /source/i });
    expect(sourceLinks.length).toBeGreaterThan(0);
    expect(sourceLinks[0]).toHaveAttribute('href', expect.stringContaining('https://us.fulbrightonline.org'));
    expect(sourceLinks[0]).toHaveAttribute('target', '_blank');
  });

  it('verifies Criterion 1: unknown deadlines render as Rolling / Unspecified without inventing dates', () => {
    render(
      <DeadlineBadge
        deadline={null}
        timezone="UTC"
        deadlineRawText="Rolling Application"
      />
    );

    expect(screen.getByText('Rolling / Unspecified')).toBeInTheDocument();
    expect(screen.queryByText(/1970|2099/)).toBeNull();
  });

  it('renders status badges with appropriate verification semantics', () => {
    const { rerender } = render(<StatusBadge status="verified" />);
    expect(screen.getByText('Verified')).toBeInTheDocument();

    rerender(<StatusBadge status="withdrawn" />);
    expect(screen.getByText(/Withdrawn/i)).toBeInTheDocument();

    rerender(<StatusBadge status="stale" />);
    expect(screen.getByText(/Stale/i)).toBeInTheDocument();
  });
});
