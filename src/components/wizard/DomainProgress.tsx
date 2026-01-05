import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  KeyRound,
  GraduationCap,
  FileSearch,
  Settings,
  LifeBuoy,
  Shield,
  Building2,
  type LucideIcon,
} from "lucide-react";
import type { DomainProgress as DomainProgressType, SecurityDomainId } from "@/types/questionnaire";
import { SECURITY_DOMAINS } from "@/types/questionnaire";

// Map icon names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  KeyRound,
  GraduationCap,
  FileSearch,
  Settings,
  LifeBuoy,
  AlertTriangle,
  Shield,
  Building2,
};

interface DomainProgressProps {
  progress: DomainProgressType[];
  currentDomain: SecurityDomainId | null;
  onSelectDomain: (domainId: SecurityDomainId) => void;
}

export function DomainProgress({
  progress,
  currentDomain,
  onSelectDomain,
}: DomainProgressProps) {
  // Create a map for quick progress lookup
  const progressMap = new Map(progress.map(p => [p.domain_id, p]));

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-muted-foreground px-2 mb-3">
        Security Domains
      </h3>
      {SECURITY_DOMAINS.map((domain) => {
        const domainProgress = progressMap.get(domain.id);
        const isActive = currentDomain === domain.id;
        const isComplete = domainProgress?.is_complete ?? false;
        const hasFindings = (domainProgress?.findings_count ?? 0) > 0;
        const IconComponent = iconMap[domain.icon] || Shield;

        return (
          <button
            key={domain.id}
            onClick={() => onSelectDomain(domain.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {isComplete ? (
                <CheckCircle2 className={cn(
                  "h-4 w-4",
                  isActive ? "text-primary-foreground" : "text-green-600 dark:text-green-400"
                )} />
              ) : (
                <Circle className={cn(
                  "h-4 w-4",
                  isActive ? "text-primary-foreground/60" : "text-muted-foreground"
                )} />
              )}
            </div>

            {/* Domain Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <IconComponent className={cn(
                  "h-4 w-4 flex-shrink-0",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-sm font-medium truncate",
                  !isActive && "text-foreground"
                )}>
                  {domain.name}
                </span>
              </div>
              
              {/* Progress indicator */}
              {domainProgress && (
                <div className={cn(
                  "text-xs mt-0.5",
                  isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {domainProgress.answered_questions}/{domainProgress.total_questions}
                  {domainProgress.score !== null && ` • ${domainProgress.score}%`}
                </div>
              )}
            </div>

            {/* Findings indicator */}
            {hasFindings && !isActive && (
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
