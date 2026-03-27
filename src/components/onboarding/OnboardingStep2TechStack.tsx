import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { OnboardingFormData } from './OnboardingStep1OrgProfile';

const TECH_STACK_OPTIONS = [
  'AWS',
  'Azure',
  'GCP',
  'On-Premise Servers',
  'Windows Server',
  'Linux',
  'Microsoft 365',
  'Google Workspace',
  'Custom Applications',
  'Mobile Devices',
  'VPN/Remote Access',
  'Cloud Storage',
];

interface Step2Props {
  formData: OnboardingFormData;
  onChange: (data: Partial<OnboardingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function OnboardingStep2TechStack({ formData, onChange, onNext, onBack }: Step2Props) {
  const canProceed = formData.techStack.length > 0;

  const toggleTech = (tech: string) => {
    const current = formData.techStack;
    const updated = current.includes(tech)
      ? current.filter((t) => t !== tech)
      : [...current, tech];
    onChange({ techStack: updated });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="text-sm text-muted-foreground mb-2">Step 2 of 4</div>
        <CardTitle>Technology Stack</CardTitle>
        <CardDescription>
          Select all technologies and platforms your organization uses. This helps us identify relevant security controls.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TECH_STACK_OPTIONS.map((tech) => (
            <div key={tech} className="flex items-center space-x-3">
              <Checkbox
                id={`tech-${tech}`}
                checked={formData.techStack.includes(tech)}
                onCheckedChange={() => toggleTech(tech)}
              />
              <Label htmlFor={`tech-${tech}`} className="cursor-pointer">
                {tech}
              </Label>
            </div>
          ))}
        </div>

        {formData.techStack.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Select at least one technology to continue.
          </p>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} disabled={!canProceed}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
