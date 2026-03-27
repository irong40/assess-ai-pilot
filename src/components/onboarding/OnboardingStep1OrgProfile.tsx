import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface OnboardingFormData {
  orgName: string;
  orgSize: string;
  systemName: string;
  techStack: string[];
  complianceGoals: string[];
  targetCmmcLevel: 1 | 2;
  environment: string;
}

interface Step1Props {
  formData: OnboardingFormData;
  onChange: (data: Partial<OnboardingFormData>) => void;
  onNext: () => void;
}

export function OnboardingStep1OrgProfile({ formData, onChange, onNext }: Step1Props) {
  const canProceed = formData.orgName.trim().length > 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="text-sm text-muted-foreground mb-2">Step 1 of 4</div>
        <CardTitle>Organization Profile</CardTitle>
        <CardDescription>
          Tell us about your organization so we can tailor the compliance assessment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="orgName">Organization Name *</Label>
          <Input
            id="orgName"
            placeholder="Enter your organization name"
            value={formData.orgName}
            onChange={(e) => onChange({ orgName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="orgSize">Organization Size</Label>
          <Select
            value={formData.orgSize}
            onValueChange={(value) => onChange({ orgSize: value })}
          >
            <SelectTrigger id="orgSize">
              <SelectValue placeholder="Select organization size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-50">1-50 employees</SelectItem>
              <SelectItem value="51-200">51-200 employees</SelectItem>
              <SelectItem value="201-500">201-500 employees</SelectItem>
              <SelectItem value="500+">500+ employees</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="systemName">System Name (optional)</Label>
          <Input
            id="systemName"
            placeholder={`${formData.orgName || 'Your Org'} IT Systems`}
            value={formData.systemName}
            onChange={(e) => onChange({ systemName: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            This will be the name of the system in your compliance assessment. Defaults to &quot;[Org Name] IT Systems&quot;.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={onNext} disabled={!canProceed}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
