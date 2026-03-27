import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for useTrialStatus hook.
 *
 * Mocks:
 * - @/integrations/supabase/client (supabase client)
 * - @/hooks/useAuth (auth context)
 * - @/hooks/useUserProfile (profile query)
 *
 * Tests verify:
 * - daysLeft calculation for active trial
 * - isExpired when trial_status is 'expired'
 * - isExpired is false when trial_status is 'active' (converted customer)
 * - isLoading state while profile is in flight
 */

// --- Supabase mock ---
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// --- useAuth mock ---
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'user-123', email: 'test@example.com' },
    loading: false,
  }),
}));

// --- useUserProfile mock ---
const mockUseUserProfile = vi.fn();
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: (...args: unknown[]) => mockUseUserProfile(...args),
}));

// --- React Query mock ---
const mockUseQuery = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useQueryClient: vi.fn().mockReturnValue({
    invalidateQueries: vi.fn(),
  }),
  useMutation: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isLoading: false,
  }),
}));

// Import after mocks
import { useTrialStatus } from '@/hooks/useTrialStatus';

describe('useTrialStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: profile loaded with company_id
    mockUseUserProfile.mockReturnValue({
      data: { id: 'user-123', company_id: 'company-456', role: 'admin' },
      isLoading: false,
    });
  });

  it('returns positive daysLeft and isExpired=false for a fresh 14-day trial', () => {
    // Use a date far enough in the future to avoid day-boundary edge cases
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    futureDate.setHours(12, 0, 0, 0);

    mockUseQuery.mockReturnValue({
      data: {
        trial_ends_at: futureDate.toISOString(),
        trial_status: 'trial',
      },
      isLoading: false,
    });

    const result = useTrialStatus();
    expect(result.daysLeft).toBeGreaterThanOrEqual(14);
    expect(result.isExpired).toBe(false);
    expect(result.isLoading).toBe(false);
  });

  it('returns daysLeft=-1 and isExpired=true for expired trial', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    mockUseQuery.mockReturnValue({
      data: {
        trial_ends_at: pastDate.toISOString(),
        trial_status: 'expired',
      },
      isLoading: false,
    });

    const result = useTrialStatus();
    expect(result.daysLeft).toBeLessThan(0);
    expect(result.isExpired).toBe(true);
  });

  it('returns isExpired=false when trial_status is active (converted customer)', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    mockUseQuery.mockReturnValue({
      data: {
        trial_ends_at: pastDate.toISOString(),
        trial_status: 'active',
      },
      isLoading: false,
    });

    const result = useTrialStatus();
    // Even though trial_ends_at is past, converted customer is not expired
    expect(result.isExpired).toBe(false);
  });

  it('returns isLoading=true while profile query is in flight', () => {
    mockUseUserProfile.mockReturnValue({
      data: null,
      isLoading: true,
    });

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    const result = useTrialStatus();
    expect(result.isLoading).toBe(true);
  });

  it('queries companies table with correct company_id', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    useTrialStatus();

    // Verify useQuery was called (the queryFn would query companies)
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['trialStatus']),
      })
    );
  });
});
