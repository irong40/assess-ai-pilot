import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAssessments } from '@/hooks/useAssessments';
import { toast } from '@/hooks/use-toast';
import {
  OnboardingStep1OrgProfile,
  type OnboardingFormData,
} from '@/components/onboarding/OnboardingStep1OrgProfile';
import { OnboardingStep2TechStack } from '@/components/onboarding/OnboardingStep2TechStack';
import { OnboardingStep3Goals } from '@/components/onboarding/OnboardingStep3Goals';
import { OnboardingStep4Confirm } from '@/components/onboarding/OnboardingStep4Confirm';

const INITIAL_FORM_DATA: OnboardingFormData = {
  orgName: '',
  orgSize: '',
  systemName: '',
  techStack: [],
  complianceGoals: [],
  targetCmmcLevel: 1,
  environment: '',
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { saveProfile, completeOnboarding } = useOnboarding();
  const { createAssessment } = useAssessments();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (data: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Save the onboarding profile
      await saveProfile.mutateAsync({
        org_size: formData.orgSize,
        primary_tech_stack: formData.techStack,
        compliance_goals: formData.complianceGoals,
        target_cmmc_level: formData.targetCmmcLevel,
        system_name: formData.systemName || `${formData.orgName} IT Systems`,
        environment: formData.environment || 'hybrid',
      });

      // 2. Create initial assessment with mapped fields
      const complianceScope =
        formData.targetCmmcLevel === 1 ? 'CMMC Level 1' : 'CMMC Level 2';

      await createAssessment.mutateAsync({
        system_name: formData.systemName || `${formData.orgName} IT Systems`,
        environment: formData.environment || 'hybrid',
        compliance_scope: complianceScope,
        status: 'in_progress',
      });

      // 3. Mark onboarding as complete
      await completeOnboarding.mutateAsync();

      toast({
        title: 'Welcome aboard!',
        description: 'Your organization is set up and your first assessment is ready.',
      });

      // 4. Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Setup Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to complete onboarding. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step progress indicator
  const steps = ['Organization', 'Tech Stack', 'Goals', 'Confirm'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">Sentinel AI</span>
          </div>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`ml-2 text-sm hidden sm:inline ${
                  index <= currentStep
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 sm:w-16 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        {currentStep === 0 && (
          <OnboardingStep1OrgProfile
            formData={formData}
            onChange={updateFormData}
            onNext={handleNext}
          />
        )}
        {currentStep === 1 && (
          <OnboardingStep2TechStack
            formData={formData}
            onChange={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 2 && (
          <OnboardingStep3Goals
            formData={formData}
            onChange={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 3 && (
          <OnboardingStep4Confirm
            formData={formData}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
