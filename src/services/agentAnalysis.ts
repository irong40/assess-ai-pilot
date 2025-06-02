
export interface AnalysisResult {
  title: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  score: number;
}

const generateAnalysisResult = (agentType: string, context?: string): AnalysisResult => {
  const analysisTemplates: Record<string, AnalysisResult> = {
    policy: {
      title: "ISSO-Policy Assessment",
      summary: "Comprehensive policy framework analysis with governance and compliance evaluation",
      strengths: [
        "Well-documented security policies covering all major domains",
        "Regular policy review and update processes established",
        "Clear policy ownership and accountability structure",
        "Policy awareness training programs implemented"
      ],
      improvements: [
        "Some policies need updates for cloud environments",
        "Policy exception handling processes need enhancement",
        "Automated policy compliance monitoring required"
      ],
      recommendations: [
        "Update policies for cloud-native architectures",
        "Implement automated policy compliance checking",
        "Enhance policy exception workflow management",
        "Strengthen vendor policy requirements"
      ],
      score: 85
    },
    physical: {
      title: "ISSO-Physical Security Assessment",
      summary: "Multi-layered physical security controls with controlled access points and environmental protections",
      strengths: [
        "24/7 security personnel on-site",
        "CCTV surveillance with 90-day retention",
        "Biometric access controls for sensitive areas",
        "Proper cable management and equipment securing"
      ],
      improvements: [
        "Visitor escort procedures need enforcement",
        "Emergency response plans require annual testing",
        "Some legacy access cards need deactivation"
      ],
      recommendations: [
        "Implement mandatory visitor escort policy",
        "Conduct quarterly emergency response drills",
        "Audit and deactivate unused access credentials",
        "Install additional surveillance in server areas"
      ],
      score: 78
    },
    network: {
      title: "ISSO-Network Security Assessment",
      summary: "Multi-tier network architecture with proper segmentation and security controls",
      strengths: [
        "Proper network segmentation between production and development",
        "Intrusion detection and prevention systems active",
        "Regular vulnerability scanning of network devices",
        "Network monitoring and logging in place"
      ],
      improvements: [
        "Some legacy network equipment needs security updates",
        "Wireless network security policies need strengthening",
        "Network device configuration standards require documentation"
      ],
      recommendations: [
        "Upgrade legacy network equipment with security patches",
        "Implement stronger wireless security protocols (WPA3)",
        "Document and standardize network device configurations",
        "Enhance network traffic monitoring capabilities"
      ],
      score: 82
    },
    access: {
      title: "ISSO-Access Control Assessment",
      summary: "Centralized identity management with multi-factor authentication and role-based access controls",
      strengths: [
        "Strong password policies and MFA enforcement",
        "Regular access reviews and deprovisioning processes",
        "Privileged access management (PAM) solution deployed",
        "Role-based access control properly configured"
      ],
      improvements: [
        "Some service accounts lack proper documentation",
        "Privileged access session recording needs enhancement",
        "Identity lifecycle management processes need automation"
      ],
      recommendations: [
        "Document all service accounts and their purposes",
        "Implement session recording for all privileged access",
        "Automate identity provisioning and deprovisioning",
        "Enhance monitoring of privileged account activities"
      ],
      score: 79
    },
    data: {
      title: "ISSO-Data Protection Assessment",
      summary: "Comprehensive data protection framework with encryption and lifecycle management",
      strengths: [
        "Data encryption using industry-standard algorithms",
        "Regular data backup and recovery testing",
        "Data loss prevention (DLP) tools deployed",
        "Clear data handling procedures documented"
      ],
      improvements: [
        "Data discovery and mapping needs enhancement",
        "Some legacy databases lack proper encryption",
        "Data privacy impact assessments need standardization"
      ],
      recommendations: [
        "Implement automated data discovery and classification tools",
        "Upgrade legacy databases with modern encryption",
        "Standardize privacy impact assessment processes",
        "Enhance data breach response procedures"
      ],
      score: 83
    },
    configuration: {
      title: "ISSO-Configuration Assessment",
      summary: "System configuration management with security hardening and change control",
      strengths: [
        "Automated configuration management tools deployed",
        "Security hardening standards documented and applied",
        "Configuration change approval processes established",
        "Regular configuration compliance scanning"
      ],
      improvements: [
        "Configuration drift detection needs automation",
        "Some systems lack standardized configurations",
        "Configuration backup and recovery processes need enhancement"
      ],
      recommendations: [
        "Implement automated configuration drift detection",
        "Standardize configurations across all system types",
        "Enhance configuration backup and restore capabilities",
        "Strengthen configuration change auditing"
      ],
      score: 80
    },
    recovery: {
      title: "ISSO-Recovery Assessment",
      summary: "Comprehensive disaster recovery and business continuity planning with testing procedures",
      strengths: [
        "Well-documented disaster recovery procedures",
        "Automated backup systems with offsite storage",
        "Regular recovery testing and validation exercises",
        "Defined RTO/RPO objectives for critical systems"
      ],
      improvements: [
        "Recovery procedures need updates for cloud infrastructure",
        "Some backup systems lack encryption in transit",
        "Recovery testing frequency should be increased"
      ],
      recommendations: [
        "Update recovery procedures for cloud-native applications",
        "Implement encryption for all backup data in transit",
        "Increase frequency of disaster recovery testing",
        "Enhance automated failover capabilities"
      ],
      score: 85
    },
    privacy: {
      title: "ISSO-Privacy Assessment",
      summary: "Comprehensive privacy program with clear governance and data subject rights management",
      strengths: [
        "Well-established privacy governance structure",
        "Regular privacy impact assessments conducted",
        "Clear data subject rights procedures implemented",
        "Privacy training programs for all staff"
      ],
      improvements: [
        "Some legacy systems lack privacy controls",
        "Cross-border data transfer procedures need enhancement",
        "Privacy monitoring and reporting automation required"
      ],
      recommendations: [
        "Retrofit privacy controls for legacy systems",
        "Enhance cross-border data transfer safeguards",
        "Implement automated privacy monitoring tools",
        "Strengthen vendor privacy assessment processes"
      ],
      score: 88
    },
    'blue-team': {
      title: "ISSO-Blue Team Assessment",
      summary: "Defensive security operations with threat detection and incident response capabilities",
      strengths: [
        "24/7 security operations center (SOC) established",
        "Advanced threat detection tools deployed",
        "Regular threat hunting activities conducted",
        "Incident response procedures well-documented"
      ],
      improvements: [
        "Threat intelligence integration needs enhancement",
        "Security tool orchestration requires improvement",
        "Advanced persistent threat detection capabilities limited"
      ],
      recommendations: [
        "Integrate external threat intelligence feeds",
        "Implement security orchestration and automation",
        "Enhance advanced persistent threat detection",
        "Strengthen threat hunting methodologies"
      ],
      score: 81
    },
    vulnerability: {
      title: "ISSO-Vulnerability Management Assessment",
      summary: "Systematic vulnerability identification and remediation program with risk-based prioritization",
      strengths: [
        "Regular vulnerability scanning across all assets",
        "Risk-based vulnerability prioritization implemented",
        "Patch management processes well-established",
        "Vulnerability metrics and reporting in place"
      ],
      improvements: [
        "Container and cloud vulnerability scanning needs enhancement",
        "Zero-day vulnerability response procedures require improvement",
        "Vulnerability disclosure coordination needs strengthening"
      ],
      recommendations: [
        "Enhance container and cloud security scanning",
        "Improve zero-day vulnerability response capabilities",
        "Strengthen coordinated vulnerability disclosure",
        "Implement continuous vulnerability assessment"
      ],
      score: 84
    },
    'threat-intel': {
      title: "ISSO-Threat Intelligence Assessment",
      summary: "Strategic threat intelligence program with analysis and dissemination capabilities",
      strengths: [
        "Multiple threat intelligence sources integrated",
        "Threat intelligence analysis team established",
        "Regular threat briefings and reports produced",
        "Threat intelligence sharing partnerships active"
      ],
      improvements: [
        "Automated threat intelligence processing needs enhancement",
        "Industry-specific threat intelligence limited",
        "Threat intelligence actionability requires improvement"
      ],
      recommendations: [
        "Implement automated threat intelligence processing",
        "Enhance industry-specific threat intelligence collection",
        "Improve threat intelligence actionability metrics",
        "Strengthen threat intelligence sharing mechanisms"
      ],
      score: 79
    },
    'supply-chain': {
      title: "ISSO-Supply Chain Assessment",
      summary: "Comprehensive third-party risk management with vendor security assessment and monitoring",
      strengths: [
        "Established vendor risk assessment program",
        "Clear security requirements for third-party vendors",
        "Regular vendor security assessments and audits",
        "Supply chain incident response procedures documented"
      ],
      improvements: [
        "Automated vendor risk monitoring needs enhancement",
        "Fourth-party (vendor's vendor) risk assessment limited",
        "Supply chain threat intelligence integration required"
      ],
      recommendations: [
        "Implement automated vendor risk monitoring tools",
        "Expand fourth-party risk assessment capabilities",
        "Integrate supply chain threat intelligence feeds",
        "Enhance vendor incident response coordination"
      ],
      score: 82
    },
    grc: {
      title: "ISSO-GRC Assessment",
      summary: "Integrated governance, risk, and compliance framework with continuous monitoring",
      strengths: [
        "Comprehensive GRC framework established",
        "Regular risk assessments and treatment plans",
        "Compliance monitoring and reporting automated",
        "Board-level security governance implemented"
      ],
      improvements: [
        "Risk quantification methodologies need enhancement",
        "Compliance automation tools require integration",
        "Third-party risk aggregation needs improvement"
      ],
      recommendations: [
        "Implement quantitative risk assessment methodologies",
        "Enhance compliance automation and integration",
        "Improve third-party risk aggregation and reporting",
        "Strengthen risk-based decision making processes"
      ],
      score: 87
    },
    training: {
      title: "ISSO-Training Assessment",
      summary: "Comprehensive security awareness training with role-based education and effectiveness measurement",
      strengths: [
        "Annual security awareness training for all employees",
        "Role-specific training for privileged users and administrators",
        "Regular phishing simulation exercises",
        "Training completion tracking and reporting"
      ],
      improvements: [
        "Training content needs to be more engaging and interactive",
        "Specialized training for emerging threats needs development",
        "Training frequency should be increased for high-risk roles"
      ],
      recommendations: [
        "Implement interactive and gamified training modules",
        "Develop training content for emerging cybersecurity threats",
        "Increase training frequency for privileged users",
        "Establish continuous security awareness campaigns"
      ],
      score: 75
    },
    mobile: {
      title: "ISSO-Mobile/BYOD Assessment",
      summary: "Comprehensive mobile device management with BYOD policies and application security controls",
      strengths: [
        "Robust mobile device management platform implemented",
        "Clear BYOD policies with user acceptance requirements",
        "Mobile application security testing integrated into SDLC",
        "Regular mobile device compliance monitoring"
      ],
      improvements: [
        "Personal vs corporate data separation needs enhancement",
        "Mobile threat detection capabilities require expansion",
        "BYOD user training and awareness programs limited"
      ],
      recommendations: [
        "Implement advanced mobile threat defense solutions",
        "Enhance personal/corporate data containerization",
        "Expand BYOD security training programs",
        "Improve mobile app risk assessment processes"
      ],
      score: 79
    },
    legal: {
      title: "ISSO-Legal Assessment",
      summary: "Comprehensive legal compliance program with regulatory alignment and risk management",
      strengths: [
        "Strong legal compliance framework with regular reviews",
        "Clear understanding of applicable regulatory requirements",
        "Good coordination between legal and cybersecurity teams",
        "Regular legal risk assessments conducted"
      ],
      improvements: [
        "Cross-border data transfer legal requirements need clarification",
        "Emerging regulation monitoring needs automation",
        "Legal incident response procedures require enhancement"
      ],
      recommendations: [
        "Clarify cross-border data transfer legal frameworks",
        "Implement automated regulatory change monitoring",
        "Enhance legal aspects of incident response procedures",
        "Strengthen vendor contract security requirements"
      ],
      score: 85
    },
    incident: {
      title: "ISSO-Incident Response Assessment",
      summary: "Comprehensive incident response program with detection, analysis, and recovery capabilities",
      strengths: [
        "Well-documented incident response procedures",
        "24/7 security operations center (SOC) monitoring",
        "Regular incident response training and tabletop exercises",
        "Established communication protocols for incidents"
      ],
      improvements: [
        "Incident response playbooks need regular updates",
        "Forensic capabilities require enhancement",
        "Post-incident review processes need standardization"
      ],
      recommendations: [
        "Update incident response playbooks quarterly",
        "Enhance digital forensics capabilities and training",
        "Implement automated incident response workflows",
        "Standardize post-incident lessons learned processes"
      ],
      score: 81
    },
    compliance: {
      title: "ISSO-Compliance Assessment",
      summary: "Multi-framework compliance program with continuous monitoring and audit readiness",
      strengths: [
        "Comprehensive compliance program with clear ownership",
        "Regular internal audits and external assessments",
        "Well-maintained compliance documentation repository",
        "Effective compliance monitoring and reporting"
      ],
      improvements: [
        "Some control implementations lack sufficient evidence",
        "Compliance training needs to be more role-specific",
        "Automated compliance monitoring tools need enhancement"
      ],
      recommendations: [
        "Strengthen evidence collection for key security controls",
        "Implement role-based compliance training programs",
        "Deploy automated compliance monitoring tools",
        "Establish continuous compliance assessment processes"
      ],
      score: 86
    },
    continuity: {
      title: "ISSO-Business Continuity Assessment",
      summary: "Comprehensive business continuity planning with crisis management and operational resilience",
      strengths: [
        "Business continuity plans cover all critical operations",
        "Regular business impact assessments conducted",
        "Crisis management team and procedures established",
        "Operational resilience testing performed annually"
      ],
      improvements: [
        "Remote work continuity plans need enhancement",
        "Supply chain continuity planning requires improvement",
        "Communication systems redundancy needs strengthening"
      ],
      recommendations: [
        "Enhance remote work business continuity capabilities",
        "Improve supply chain continuity planning and testing",
        "Strengthen communication systems redundancy",
        "Implement automated continuity monitoring"
      ],
      score: 83
    }
  };

  const baseResult = analysisTemplates[agentType] || analysisTemplates.policy;
  
  // Add context if provided
  const contextNote = context ? `\n\n## Additional Context Analysis\nUser provided context: "${context}"` : '';
  
  return {
    ...baseResult,
    summary: baseResult.summary + contextNote
  };
};

export const analyzeAgent = async (agentType: string, files: File[], context?: string): Promise<string> => {
  // Simulate analysis time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
  
  const result = generateAnalysisResult(agentType, context);
  
  const analysisText = `# ${result.title}

## Executive Summary
${result.summary}

## Key Findings

### Strengths
${result.strengths.map(strength => `- ${strength}`).join('\n')}

### Areas for Improvement
${result.improvements.map(improvement => `- ${improvement}`).join('\n')}

## Recommendations
${result.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

## Compliance Score: ${result.score}/100

${files.length > 0 ? `\n## Document Analysis\nAnalyzed ${files.length} uploaded document(s): ${files.map(f => f.name).join(', ')}` : ''}`;

  return analysisText;
};
