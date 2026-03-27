import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { TrialBanner } from '@/components/onboarding/TrialBanner';
import { AppBreadcrumbs } from './AppBreadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTrialStatus } from '@/hooks/useTrialStatus';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const { data: profile } = useUserProfile();
  const { trialEndsAt, trialStatus } = useTrialStatus();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const userRole = profile?.role || 'viewer';
  const roleLabel = userRole.toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center gap-4">
            {/* Logo */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground hidden sm:inline">
                Sentinel AI
              </span>
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-border hidden sm:block" />

            {/* Breadcrumbs */}
            <div className="flex-1 min-w-0">
              <AppBreadcrumbs />
            </div>

            {/* Right side actions */}
            {user && (
              <div className="flex items-center gap-3">
                <NotificationBell />

                <div className="hidden sm:flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground max-w-[150px] truncate">
                    {user.email}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {roleLabel}
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Sign Out</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Trial Banner */}
      {trialStatus === 'trial' && (
        <TrialBanner trialEndsAt={trialEndsAt} trialStatus={trialStatus} />
      )}

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
