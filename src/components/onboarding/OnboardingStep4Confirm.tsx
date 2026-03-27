import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { OnboardingFormData } from './OnboardingStep1OrgProfile';

interface Step4Props {
  formData: OnboardingFormData;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function OnboardingStep4Confirm({ formData, onBack, onSubmit, isSubmitting }: Step4Props) {
  const systemName = formData.systemName || `${formData.orgName} IT Systems`;
  const complianceScope = formData.targetCmmcLevel === 1 ? 'CMMC Level 1' : 'CMMC Level 2';
  const environment = formData.environment || 'hybrid';

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="text-sm text-muted-foreground mb-2">Step 4 of 4</div>
        <CardTitle>Review & Confirm</CardTitle>
        <CardDescription>
          Review your organization details below. We will create your first compliance assessment based on this information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Organization Details */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Organization
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Name</div>
            <div className="font-medium">{formData.orgName}</div>
            <div className="text-muted-foreground">Size</div>
            <div className="font-medium">{formData.orgSize || 'Not specified'}</div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Technology Stack
          </h3>
          <div className="flex flex-wrap gap-2">
            {formData.techStack.map((tech) => (
              <Badge key={tech} variant="secondary">
                {tech}
              </Badge>
            ))}
          </div>
        </div>

        {/* Compliance Goals */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Compliance Goals
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Target Level</div>
            <div className="font-medium">{complianceScope}</div>
            <div className="text-muted-foreground">Environment</div>
            <div className="font-medium capitalize">{environment}</div>
          </div>
          {formData.complianceGoals.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.complianceGoals.map((goal) => (
                <Badge key={goal} variant="outline">
                  {goal}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Assessment Preview */}
        <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Assessment to Create
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">System Name</div>
            <div className="font-medium">{systemName}</div>
            <div className="text-muted-foreground">Environment</div>
            <div className="font-medium capitalize">{environment}</div>
            <div className="text-muted-foreground">Compliance Scope</div>
            <div className="font-medium">{complianceScope}</div>
            <div className="text-muted-foreground">Status</div>
            <div className="font-medium">In Progress</div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Setting up...' : 'Start Assessment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
