
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DaapmPositionsSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const DAAPM_POSITIONS = [
  { value: "authorizing-official", label: "Authorizing Official (AO)" },
  { value: "authorizing-official-designated-representative", label: "Authorizing Official Designated Representative (AODR)" },
  { value: "senior-agency-information-security-officer", label: "Senior Agency Information Security Officer (SAISO)" },
  { value: "senior-agency-official-privacy", label: "Senior Agency Official for Privacy (SAOP)" },
  { value: "chief-information-officer", label: "Chief Information Officer (CIO)" },
  { value: "information-system-security-officer", label: "Information System Security Officer (ISSO)" },
  { value: "information-system-security-manager", label: "Information System Security Manager (ISSM)" },
  { value: "information-owner", label: "Information Owner (IO)" },
  { value: "information-system-owner", label: "Information System Owner (ISO)" },
  { value: "common-control-provider", label: "Common Control Provider (CCP)" },
  { value: "control-assessor", label: "Control Assessor (CA)" },
  { value: "security-control-assessor", label: "Security Control Assessor (SCA)" },
  { value: "privacy-officer", label: "Privacy Officer (PO)" },
  { value: "privacy-official", label: "Privacy Official" },
  { value: "system-administrator", label: "System Administrator (SA)" },
  { value: "network-administrator", label: "Network Administrator (NA)" },
  { value: "database-administrator", label: "Database Administrator (DBA)" },
  { value: "application-administrator", label: "Application Administrator (AA)" },
  { value: "security-administrator", label: "Security Administrator" },
  { value: "system-security-plan-developer", label: "System Security Plan Developer" },
  { value: "contingency-plan-coordinator", label: "Contingency Plan Coordinator" },
  { value: "incident-response-team-member", label: "Incident Response Team Member" },
  { value: "penetration-tester", label: "Penetration Tester" },
  { value: "vulnerability-assessment-analyst", label: "Vulnerability Assessment Analyst" },
  { value: "risk-executive", label: "Risk Executive (RE)" },
  { value: "chief-risk-officer", label: "Chief Risk Officer (CRO)" },
  { value: "mission-owner", label: "Mission Owner" },
  { value: "business-owner", label: "Business Owner" },
  { value: "data-owner", label: "Data Owner" },
  { value: "custodian", label: "Custodian" },
  { value: "user", label: "User" },
  { value: "privileged-user", label: "Privileged User" },
  { value: "system-developer", label: "System Developer" },
  { value: "system-maintainer", label: "System Maintainer" },
  { value: "configuration-manager", label: "Configuration Manager" },
  { value: "change-control-board-member", label: "Change Control Board Member" },
  { value: "physical-security-officer", label: "Physical Security Officer" },
  { value: "personnel-security-officer", label: "Personnel Security Officer" },
  { value: "industrial-security-officer", label: "Industrial Security Officer" },
  { value: "operations-security-officer", label: "Operations Security Officer (OPSEC)" },
  { value: "communications-security-officer", label: "Communications Security Officer (COMSEC)" },
  { value: "tempest-officer", label: "TEMPEST Officer" },
  { value: "supply-chain-risk-manager", label: "Supply Chain Risk Manager" },
  { value: "acquisition-official", label: "Acquisition Official" },
  { value: "contracting-officer", label: "Contracting Officer" },
  { value: "contracting-officers-representative", label: "Contracting Officer's Representative (COR)" },
  { value: "inspector-general", label: "Inspector General (IG)" },
  { value: "auditor", label: "Auditor" },
  { value: "legal-counsel", label: "Legal Counsel" },
  { value: "human-resources-officer", label: "Human Resources Officer" },
  { value: "training-officer", label: "Training Officer" },
  { value: "security-awareness-coordinator", label: "Security Awareness Coordinator" },
  { value: "other", label: "Other" }
];

const DaapmPositionsSelect = ({ value, onValueChange }: DaapmPositionsSelectProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select DAAPM position" />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {DAAPM_POSITIONS.map((position) => (
          <SelectItem key={position.value} value={position.value}>
            {position.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default DaapmPositionsSelect;
