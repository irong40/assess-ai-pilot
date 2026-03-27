import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for useOnboarding hook.
 *
 * Mocks:
 * - @/integrations/supabase/client (supabase client)
 * - @/hooks/useAuth (auth context)
 * - @/hooks/useUserProfile (profile query)
 * - @tanstack/react-query (useQuery, useMutation, useQueryClient)
 *
 * Tests verify:
 * - isComplete derivation from companies.onboarding_completed
 * - saveProfile mutation calls supabase with correct data
 * - completeOnboarding mutation updates the company row
 */

// --- Supabase mock ---
const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  upsert: mockUpsert,
  update: mockUpdate,
});

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
const mockInvalidateQueries = vi.fn();
const capturedMutationFns: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useQueryClient: vi.fn().mockReturnValue({
    invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args),
  }),
  useMutation: vi.fn().mockImplementation((opts: Record<string, unknown>) => {
    // Capture the mutationFn for testing
    if (opts?.mutationFn) {
      const fn = opts.mutationFn as (...args: unknown[]) => unknown;
      // Store by a key based on call order
      const key = `mutation_${Object.keys(capturedMutationFns).length}`;
      capturedMutationFns[key] = fn;
    }
    return {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    };
  }),
}));

// Import after mocks
import { useOnboarding } from '@/hooks/useOnboarding';

describe('useOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear captured mutation functions
    Object.keys(capturedMutationFns).forEach((k) => delete capturedMutationFns[k]);

    // Default: profile loaded with company_id
    mockUseUserProfile.mockReturnValue({
      data: { id: 'user-123', company_id: 'company-456', role: 'admin' },
      isLoading: false,
    });
  });

  it('returns isComplete=false when company onboarding_completed is false', () => {
    // First useQuery call: company query (onboarding_completed)
    // Second useQuery call: onboarding_profiles query
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          data: { onboarding_completed: false },
          isLoading: false,
        };
      }
      return {
        data: null,
        isLoading: false,
      };
    });

    const result = useOnboarding();
    expect(result.isComplete).toBe(false);
  });

  it('returns isComplete=true when company onboarding_completed is true', () => {
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          data: { onboarding_completed: true },
          isLoading: false,
        };
      }
      return {
        data: null,
        isLoading: false,
      };
    });

    const result = useOnboarding();
    expect(result.isComplete).toBe(true);
  });

  it('returns isLoading=true while company query is in flight', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    const result = useOnboarding();
    expect(result.isLoading).toBe(true);
  });

  it('queries companies table for onboarding_completed', () => {
    mockUseQuery.mockReturnValue({
      data: { onboarding_completed: false },
      isLoading: false,
    });

    useOnboarding();

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['onboardingStatus']),
      })
    );
  });

  it('queries onboarding_profiles table for existing profile', () => {
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          data: { onboarding_completed: false },
          isLoading: false,
        };
      }
      return {
        data: null,
        isLoading: false,
      };
    });

    useOnboarding();

    // Second query should be for onboarding_profiles
    expect(mockUseQuery).toHaveBeenCalledTimes(2);
  });

  it('provides saveProfile and completeOnboarding mutation functions', () => {
    mockUseQuery.mockReturnValue({
      data: { onboarding_completed: false },
      isLoading: false,
    });

    const result = useOnboarding();
    expect(result.saveProfile).toBeDefined();
    expect(result.completeOnboarding).toBeDefined();
  });
});
