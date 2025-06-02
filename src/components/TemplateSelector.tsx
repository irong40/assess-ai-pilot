
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  sections: number;
  pages: string;
}

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
}

const TemplateSelector = ({ templates, selectedTemplate, onTemplateSelect }: TemplateSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Layout className="h-5 w-5" />
          <span>Report Template</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => onTemplateSelect(template.id)}
            >
              <h4 className="font-semibold text-slate-900 mb-2">{template.name}</h4>
              <p className="text-sm text-slate-600 mb-3">{template.description}</p>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{template.sections} sections</span>
                <span>{template.pages} pages</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateSelector;
