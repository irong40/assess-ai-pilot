import { differenceInDays } from 'date-fns';

interface TrialBannerProps {
  trialEndsAt: string | null;
  trialStatus: string | null;
}

export function TrialBanner({ trialEndsAt, trialStatus }: TrialBannerProps) {
  // Only show for trial users
  if (trialStatus !== 'trial' || !trialEndsAt) {
    return null;
  }

  const daysLeft = differenceInDays(new Date(trialEndsAt), new Date());

  // Don't show if already expired (they'd be on the expired page)
  if (daysLeft < 0) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-sm text-amber-700">
      <div className="container mx-auto">
        Trial period: <strong>{daysLeft}</strong> {daysLeft === 1 ? 'day' : 'days'} remaining.
      </div>
    </div>
  );
}
