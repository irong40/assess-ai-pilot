import { Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TrialExpired() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Trial Period Expired</CardTitle>
          <CardDescription>
            Your 14-day trial has ended. To continue using Sentinel AI for CMMC compliance, please contact our team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground">
            <p>Contact us to continue your compliance journey:</p>
            <p className="font-medium text-foreground mt-2">
              sales@sentinelai.com
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4 border-t">
            <Shield className="h-4 w-4" />
            <span>Sentinel AI</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
