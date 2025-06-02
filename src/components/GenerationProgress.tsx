
import { Card, CardContent } from "@/components/ui/card";
import { Bot } from "lucide-react";

const GenerationProgress = () => {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="text-center">
          <Bot className="h-8 w-8 text-blue-600 mx-auto mb-3 animate-pulse" />
          <h4 className="font-medium text-blue-900 mb-2">AI Report Generation</h4>
          <p className="text-sm text-blue-700 mb-3">
            Compiling findings, formatting content, and applying branding...
          </p>
          <div className="space-y-2 text-xs text-blue-600">
            <div>✓ Analyzing assessment data</div>
            <div>⏳ Applying template structure</div>
            <div>⏳ Generating visualizations</div>
            <div>⏳ Formatting document</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GenerationProgress;
