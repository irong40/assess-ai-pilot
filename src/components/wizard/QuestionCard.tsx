import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { HelpCircle, ChevronDown, CheckCircle2, AlertTriangle, XCircle, MinusCircle } from "lucide-react";
import type { QuestionWithResponse, ResponseValue } from "@/types/questionnaire";
import { RESPONSE_VALUES, responseCreatesFinding } from "@/types/questionnaire";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: QuestionWithResponse;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (responseValue: string, notes: string | null, createsFinding: boolean) => void;
  isSubmitting?: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  isSubmitting = false,
}: QuestionCardProps) {
  const [selectedValue, setSelectedValue] = useState<string>(
    question.response?.response_value || ""
  );
  const [notes, setNotes] = useState<string>(question.response?.notes || "");
  const [showNotes, setShowNotes] = useState(!!question.response?.notes);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    const createsFinding = responseCreatesFinding(value, question.response_type);
    onAnswer(value, notes || null, createsFinding);
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    if (selectedValue) {
      const createsFinding = responseCreatesFinding(selectedValue, question.response_type);
      onAnswer(selectedValue, newNotes || null, createsFinding);
    }
  };

  const responseOptions = getResponseOptions(question.response_type);
  const hasAnswer = !!question.response;
  const willCreateFinding = selectedValue && responseCreatesFinding(selectedValue, question.response_type);

  return (
    <Card className={cn(
      "transition-all",
      hasAnswer && "border-green-200 dark:border-green-900/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                Question {questionNumber} of {totalQuestions}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {question.control_id}
              </Badge>
              <RiskBadge weight={question.risk_weight} />
            </div>
            <CardTitle className="text-base font-medium leading-relaxed">
              {question.question_text}
            </CardTitle>
          </div>
          {question.help_text && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">{question.help_text}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Response Options */}
        <div className="flex flex-wrap gap-2">
          {responseOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedValue === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleSelect(option.value)}
              disabled={isSubmitting}
              className={cn(
                "min-w-[80px]",
                selectedValue === option.value && option.variant
              )}
            >
              <option.icon className="mr-2 h-4 w-4" />
              {option.label}
            </Button>
          ))}
        </div>

        {/* Finding Warning */}
        {willCreateFinding && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">
              This response will generate a finding that can be tracked in your POA&M.
            </p>
          </div>
        )}

        {/* Notes Section */}
        <Collapsible open={showNotes} onOpenChange={setShowNotes}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="text-muted-foreground">
                {notes ? "Edit notes/evidence" : "Add notes or evidence"}
              </span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                showNotes && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Textarea
              placeholder="Add supporting notes, evidence references, or additional context..."
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// Helper component for risk weight badge
function RiskBadge({ weight }: { weight: number }) {
  const variant = weight >= 9 ? "destructive" : weight >= 7 ? "default" : "secondary";
  const label = weight >= 9 ? "Critical" : weight >= 7 ? "High" : weight >= 4 ? "Medium" : "Low";
  
  return (
    <Badge variant={variant} className="text-xs">
      {label} Risk
    </Badge>
  );
}

// Get response options based on question type
function getResponseOptions(responseType: string) {
  const baseOptions = [
    {
      value: RESPONSE_VALUES.YES,
      label: "Yes",
      icon: CheckCircle2,
      variant: "bg-green-600 hover:bg-green-700",
    },
    {
      value: RESPONSE_VALUES.NO,
      label: "No",
      icon: XCircle,
      variant: "bg-red-600 hover:bg-red-700",
    },
  ];

  if (responseType === "yes_no_partial") {
    return [
      ...baseOptions.slice(0, 1),
      {
        value: RESPONSE_VALUES.PARTIAL,
        label: "Partial",
        icon: MinusCircle,
        variant: "bg-amber-600 hover:bg-amber-700",
      },
      ...baseOptions.slice(1),
    ];
  }

  if (responseType === "yes_no_na") {
    return [
      ...baseOptions,
      {
        value: RESPONSE_VALUES.NA,
        label: "N/A",
        icon: MinusCircle,
        variant: "bg-gray-600 hover:bg-gray-700",
      },
    ];
  }

  return baseOptions;
}
