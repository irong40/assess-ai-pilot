import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OnboardingFormData } from './OnboardingStep1OrgProfile';

const COMPLIANCE_GOALS = [
  'Achieve CMMC certification',
  'Improve SPRS score',
  'Prepare for audit',
  'Understand gaps',
];

interface Step3Props {
  formData: OnboardingFormData;
  onChange: (data: Partial<OnboardingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function OnboardingStep3Goals({ formData, onChange, onNext, onBack }: Step3Props) {
  const toggleGoal = (goal: string) => {
    const current = formData.complianceGoals;
    const updated = current.includes(goal)
      ? current.filter((g) => g !== goal)
      : [...current, goal];
    onChange({ complianceGoals: updated });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="text-sm text-muted-foreground mb-2">Step 3 of 4</div>
        <CardTitle>Compliance Goals</CardTitle>
        <CardDescription>
          Define your target compliance level and objectives to guide the assessment process.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Target CMMC Level</Label>
          <RadioGroup
            value={String(formData.targetCmmcLevel)}
            onValueChange={(value) =>
              onChange({ targetCmmcLevel: Number(value) as 1 | 2 })
            }
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="1" id="level-1" />
              <Label htmlFor="level-1" className="cursor-pointer">
                <span className="font-medium">Level 1</span>
                <span className="text-muted-foreground ml-2">- Basic safeguarding (17 practices)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="2" id="level-2" />
              <Label htmlFor="level-2" className="cursor-pointer">
                <span className="font-medium">Level 2</span>
                <span className="text-muted-foreground ml-2">- Advanced (110 practices, NIST 800-171)</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label>Compliance Goals</Label>
          <div className="space-y-3">
            {COMPLIANCE_GOALS.map((goal) => (
              <div key={goal} className="flex items-center space-x-3">
                <Checkbox
                  id={`goal-${goal}`}
                  checked={formData.complianceGoals.includes(goal)}
                  onCheckedChange={() => toggleGoal(goal)}
                />
                <Label htmlFor={`goal-${goal}`} className="cursor-pointer">
                  {goal}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="environment">Environment</Label>
          <Select
            value={formData.environment}
            onValueChange={(value) => onChange({ environment: value })}
          >
            <SelectTrigger id="environment">
              <SelectValue placeholder="Select your environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cloud">Cloud</SelectItem>
              <SelectItem value="on-premise">On-Premise</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
