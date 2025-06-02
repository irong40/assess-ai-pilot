
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Settings } from "lucide-react";

interface AutomationConfig {
  automaticSchedule: string;
  notificationEmails: string[];
}

interface AutomationSettingsProps {
  config: AutomationConfig;
  automationEnabled: boolean;
  onConfigChange: (key: string, value: any) => void;
  onScheduleReport: () => void;
}

const AutomationSettings = ({ 
  config, 
  automationEnabled, 
  onConfigChange, 
  onScheduleReport 
}: AutomationSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Report Automation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="schedule">Automatic Generation Schedule</Label>
          <Select
            value={config.automaticSchedule}
            onValueChange={(value) => onConfigChange('automaticSchedule', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annually">Annually</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Notification Recipients</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {config.notificationEmails.map((email, index) => (
              <Badge key={index} variant="secondary">
                {email}
              </Badge>
            ))}
          </div>
          <Input placeholder="Add email address..." />
        </div>

        {!automationEnabled && (
          <Button 
            onClick={onScheduleReport}
            variant="outline"
            className="w-full"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Enable Automated Reports
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AutomationSettings;
