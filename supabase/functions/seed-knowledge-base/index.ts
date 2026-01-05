import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sample NIST 800-53 and RMF framework documents for seeding the knowledge base
const SEED_DOCUMENTS = [
  {
    id: "nist-800-53-overview",
    name: "NIST SP 800-53 Rev 5 - Security Controls Overview",
    type: "framework",
    content: `# NIST Special Publication 800-53 Revision 5
## Security and Privacy Controls for Information Systems and Organizations

### Overview
NIST SP 800-53 provides a catalog of security and privacy controls for federal information systems and organizations. The controls are designed to protect organizational operations, assets, individuals, and the Nation from a diverse set of threats.

### Control Families
The 800-53 control catalog is organized into 20 control families:

1. **AC - Access Control**: Policies and procedures for limiting system access to authorized users.
2. **AT - Awareness and Training**: Security awareness training requirements.
3. **AU - Audit and Accountability**: Audit record creation, protection, and review.
4. **CA - Assessment, Authorization, and Monitoring**: Security assessment and continuous monitoring.
5. **CM - Configuration Management**: Baseline configurations and change control.
6. **CP - Contingency Planning**: Disaster recovery and business continuity.
7. **IA - Identification and Authentication**: User identification and authentication mechanisms.
8. **IR - Incident Response**: Incident handling and reporting procedures.
9. **MA - Maintenance**: System maintenance policies and procedures.
10. **MP - Media Protection**: Protection of digital and non-digital media.
11. **PE - Physical and Environmental Protection**: Physical access controls.
12. **PL - Planning**: Security planning documentation.
13. **PM - Program Management**: Information security program management.
14. **PS - Personnel Security**: Personnel screening and termination procedures.
15. **PT - PII Processing and Transparency**: Privacy controls for personally identifiable information.
16. **RA - Risk Assessment**: Risk assessment methodologies and vulnerability scanning.
17. **SA - System and Services Acquisition**: Acquisition and development security.
18. **SC - System and Communications Protection**: Network and communications security.
19. **SI - System and Information Integrity**: Malware protection and system monitoring.
20. **SR - Supply Chain Risk Management**: Supply chain security controls.

### Control Baselines
NIST 800-53 defines three security control baselines:
- **Low Baseline**: For systems where loss would have limited adverse effect.
- **Moderate Baseline**: For systems where loss would have serious adverse effect.
- **High Baseline**: For systems where loss would have severe or catastrophic effect.

### Privacy Controls
Revision 5 integrates privacy controls throughout the catalog, addressing requirements from OMB Circular A-130 and the Privacy Act.`,
  },
  {
    id: "rmf-process-guide",
    name: "Risk Management Framework (RMF) Process Guide",
    type: "framework",
    content: `# Risk Management Framework (RMF) Process Guide
## NIST SP 800-37 Revision 2

### Overview
The Risk Management Framework (RMF) provides a structured approach for managing security and privacy risk. It integrates security, privacy, and cyber supply chain risk management activities into the system development life cycle.

### RMF Steps

#### Step 1: Prepare
Carry out essential activities at the organization, mission/business process, and system levels to prepare for security and privacy risk management.

Key Tasks:
- Assign roles and responsibilities
- Establish risk management strategy
- Identify common controls
- Conduct organization-level risk assessment
- Develop system-level security and privacy plans

#### Step 2: Categorize
Categorize the system and the information processed, stored, and transmitted based on an impact analysis.

Key Tasks:
- Document system characteristics
- Perform security categorization (FIPS 199)
- Document categorization decision
- Obtain approval from authorizing official

#### Step 3: Select
Select an initial set of controls for the system and tailor the controls as needed.

Key Tasks:
- Select control baseline (NIST 800-53B)
- Tailor controls based on risk assessment
- Document control selection rationale
- Develop continuous monitoring strategy

#### Step 4: Implement
Implement the controls and document how they are employed.

Key Tasks:
- Implement selected controls
- Document control implementation
- Update system security plan

#### Step 5: Assess
Assess the controls to determine if they are implemented correctly and producing desired outcomes.

Key Tasks:
- Develop assessment plan
- Conduct control assessment
- Document assessment results
- Remediate deficiencies

#### Step 6: Authorize
Senior official makes a risk-based decision to authorize the system to operate.

Key Tasks:
- Prepare authorization package
- Analyze and determine risk
- Provide authorization decision
- Report authorization decision

#### Step 7: Monitor
Continuously monitor the system and its environment of operation.

Key Tasks:
- Monitor control effectiveness
- Analyze and respond to changes
- Conduct ongoing assessments
- Report security and privacy posture

### Authorization Package Components
- System Security Plan (SSP)
- Security Assessment Report (SAR)
- Plan of Action and Milestones (POA&M)
- Authorization Decision Document`,
  },
  {
    id: "ssp-requirements",
    name: "System Security Plan (SSP) Requirements",
    type: "guidance",
    content: `# System Security Plan (SSP) Requirements
## NIST SP 800-18 Guidance

### Purpose
The System Security Plan (SSP) is a formal document that provides an overview of the security requirements for an information system and describes the security controls in place or planned for meeting those requirements.

### Required SSP Sections

#### 1. System Identification
- System name and identifier
- System owner and authorizing official
- System categorization (Low/Moderate/High)
- Operational status (Operational, Development, etc.)

#### 2. System Description
- System function and purpose
- System environment and architecture
- Information types processed
- User types and access methods

#### 3. System Boundary
- Authorization boundary definition
- Hardware inventory
- Software inventory
- Network connections and data flows

#### 4. Security Control Implementation
For each applicable control:
- Control implementation status
- Responsible entities
- Implementation description
- Parameters and settings
- Supporting artifacts

#### 5. Continuous Monitoring
- Monitoring strategy
- Assessment schedule
- POA&M management process
- Reporting requirements

### SSP Best Practices
1. Keep the SSP current and accurate
2. Reference supporting documentation
3. Use clear, consistent language
4. Document compensating controls
5. Include diagrams and visual aids
6. Maintain version control

### Common SSP Weaknesses
- Incomplete control descriptions
- Missing implementation details
- Outdated information
- Unclear authorization boundary
- Insufficient evidence references`,
  },
  {
    id: "poam-guidance",
    name: "Plan of Action and Milestones (POA&M) Management",
    type: "guidance",
    content: `# Plan of Action and Milestones (POA&M) Management Guide

### Purpose
The POA&M documents the planned remediation actions to correct weaknesses or deficiencies noted during the assessment of security controls and to reduce or eliminate known vulnerabilities in a system.

### Required POA&M Elements

#### Weakness Identification
- Weakness identifier (unique tracking number)
- Point of contact
- Source of weakness (Assessment, Scan, Audit)
- Date identified
- Control or area affected

#### Weakness Description
- Clear description of the weakness
- Security control(s) affected
- Asset(s) affected
- Impact to system operations

#### Risk Assessment
- Risk level (Critical, High, Medium, Low)
- Likelihood of exploitation
- Potential impact if exploited
- Threat vectors

#### Remediation Plan
- Planned corrective action
- Resources required (funding, personnel, tools)
- Milestones with target dates
- Responsible parties
- Dependencies and constraints

#### Status Tracking
- Current status (Open, In Progress, Completed, Risk Accepted)
- Scheduled completion date
- Actual completion date
- Comments and progress notes
- Verification method

### POA&M Lifecycle
1. **Identification**: Document weakness from assessment, scan, or audit
2. **Analysis**: Determine root cause and risk level
3. **Planning**: Develop remediation strategy and milestones
4. **Execution**: Implement corrective actions
5. **Verification**: Confirm weakness is remediated
6. **Closure**: Document completion and lessons learned

### POA&M Metrics
- Total open items by risk level
- Items past scheduled completion date
- Average time to remediation
- Items closed per reporting period
- Resource allocation by risk level`,
  },
  {
    id: "sar-requirements",
    name: "Security Assessment Report (SAR) Requirements",
    type: "guidance",
    content: `# Security Assessment Report (SAR) Requirements
## NIST SP 800-53A Guidance

### Purpose
The Security Assessment Report (SAR) documents the results of the security control assessment, providing evidence of the effectiveness of controls and identifying weaknesses or deficiencies.

### SAR Components

#### Executive Summary
- Assessment scope and objectives
- Summary of findings
- Overall system security posture
- Key recommendations

#### Assessment Methodology
- Assessment procedures used
- Assessment team qualifications
- Tools and techniques employed
- Evidence collection methods

#### Findings by Control
For each assessed control:
- Control identifier and title
- Assessment objective(s)
- Assessment methods used
- Findings (Satisfied, Other Than Satisfied, Not Applicable)
- Supporting evidence
- Weakness details (if applicable)
- Recommended corrective actions

#### Vulnerability Assessment Results
- Vulnerability scan results
- Penetration test findings
- Configuration assessment results
- Code review findings (if applicable)

#### Risk Analysis
- Identified risks by severity
- Attack vectors and threat scenarios
- Compensating controls considered
- Residual risk assessment

### Assessment Determination Findings
- **Satisfied**: Control is implemented correctly and operating as intended
- **Other Than Satisfied**: Control has deficiencies requiring remediation
- **Not Applicable**: Control does not apply to the system

### SAR Best Practices
1. Document assessment procedures thoroughly
2. Provide clear evidence references
3. Use consistent finding categories
4. Include actionable recommendations
5. Reference CVE/CWE identifiers where applicable
6. Maintain chain of custody for evidence`,
  },
  {
    id: "nist-800-53-access-control",
    name: "NIST 800-53 Access Control Family (AC)",
    type: "framework",
    content: `# NIST 800-53 Access Control Family (AC)

### Overview
The Access Control family addresses policies and procedures for limiting system access to authorized users, processes, or devices.

### Key Controls

#### AC-1: Policy and Procedures
- Develop, document, and disseminate access control policy
- Review and update policy at defined frequency
- Assign organizational personnel to manage access control

#### AC-2: Account Management
- Define account types (privileged, non-privileged, system, guest)
- Establish conditions for group/role membership
- Identify authorized users and access authorizations
- Require approvals for account requests
- Monitor account usage
- Disable inactive accounts
- Review accounts at defined frequency

#### AC-3: Access Enforcement
- Enforce approved authorizations for logical access
- Implement role-based access control (RBAC)
- Apply principle of least privilege

#### AC-4: Information Flow Enforcement
- Enforce approved authorizations for controlling information flow
- Implement boundary protection mechanisms
- Control information flow between security domains

#### AC-5: Separation of Duties
- Define and document duties to be separated
- Implement separation of duties through access authorizations
- Prevent any single individual from completing critical functions

#### AC-6: Least Privilege
- Employ least privilege principle
- Authorize access only for functions users need
- Restrict privileged accounts to authorized personnel

#### AC-7: Unsuccessful Logon Attempts
- Enforce limit on consecutive invalid logon attempts
- Automatically lock account after defined number of failures
- Require administrator unlock or timed lockout

#### AC-8: System Use Notification
- Display system use notification before granting access
- Include privacy and security notices
- Require user acknowledgment

#### AC-11: Device Lock
- Prevent access via pattern-hiding display
- Initiate session lock after defined period of inactivity
- Retain session lock until user re-authenticates

#### AC-17: Remote Access
- Establish usage restrictions for remote access
- Document remote access methods allowed
- Implement cryptographic mechanisms to protect remote sessions
- Monitor and control remote access

#### AC-18: Wireless Access
- Establish usage restrictions for wireless access
- Monitor for unauthorized wireless access points
- Protect wireless communications using authentication and encryption

#### AC-20: Use of External Systems
- Establish terms and conditions for external system use
- Restrict or prohibit use of organization-controlled portable storage
- Limit connection of external systems to organizational systems`,
  },
  {
    id: "nist-800-53-incident-response",
    name: "NIST 800-53 Incident Response Family (IR)",
    type: "framework",
    content: `# NIST 800-53 Incident Response Family (IR)

### Overview
The Incident Response family addresses organizational incident response policies, procedures, and capabilities.

### Key Controls

#### IR-1: Policy and Procedures
- Develop and document incident response policy
- Address purpose, scope, roles, responsibilities
- Ensure policy is consistent with laws and directives
- Review and update policy at defined frequency

#### IR-2: Incident Response Training
- Provide incident response training to personnel
- Train users on their incident response roles
- Include simulated events in training
- Review and update training content regularly

#### IR-3: Incident Response Testing
- Test incident response capability at defined frequency
- Use tabletop exercises, simulations, or actual incidents
- Document test results and lessons learned
- Coordinate testing with organizational elements

#### IR-4: Incident Handling
- Implement incident handling capability
- Include preparation, detection, analysis, containment, eradication, recovery
- Coordinate incident handling activities with contingency planning
- Incorporate lessons learned into procedures

Key activities:
- Preparation: Training, tools, playbooks
- Detection and Analysis: Monitoring, triage, impact assessment
- Containment: Short-term and long-term strategies
- Eradication: Remove malicious code, close vulnerabilities
- Recovery: Restore systems, confirm normal operations
- Post-Incident Activity: Lessons learned, reporting

#### IR-5: Incident Monitoring
- Track and document incidents on an ongoing basis
- Monitor incident categories and trends
- Report incident information to designated personnel

#### IR-6: Incident Reporting
- Require personnel to report suspected incidents
- Report incidents to appropriate authorities
- Comply with reporting timelines (e.g., 72-hour CISA requirement)
- Protect incident information from unauthorized disclosure

#### IR-7: Incident Response Assistance
- Provide incident response support resources
- Include help desk and response teams
- Coordinate assistance with external providers

#### IR-8: Incident Response Plan
- Develop an incident response plan that:
  - Provides roadmap for implementing capability
  - Describes structure and organization of capability
  - Defines reportable incidents
  - Provides metrics for measuring capability
  - Defines resources and management support
  - Reviews and approves the plan
  - Distributes copies to incident response personnel

#### IR-9: Information Spillage Response
- Respond to information spills
- Identify personnel with access to compromised information
- Implement procedures to contain and remediate spills
- Report spills to appropriate authorities`,
  },
  {
    id: "continuous-monitoring-strategy",
    name: "Continuous Monitoring Strategy Guide",
    type: "cms",
    content: `# Continuous Monitoring Strategy Guide
## NIST SP 800-137 Information Security Continuous Monitoring (ISCM)

### Purpose
Continuous monitoring maintains ongoing awareness of information security, vulnerabilities, and threats to support organizational risk management decisions.

### ISCM Components

#### 1. Define Strategy
- Determine security metrics to monitor
- Establish monitoring frequencies
- Identify responsible parties
- Define reporting requirements

#### 2. Establish Program
- Implement monitoring technologies
- Configure automated tools
- Develop analysis procedures
- Create reporting dashboards

#### 3. Implement Program
- Deploy monitoring capabilities
- Train personnel on tools and procedures
- Begin data collection
- Validate monitoring effectiveness

#### 4. Analyze and Report
- Analyze collected data
- Identify security issues
- Generate reports for stakeholders
- Track metrics over time

#### 5. Respond
- Address identified issues
- Update POA&M as needed
- Implement corrective actions
- Document lessons learned

#### 6. Review and Update
- Assess program effectiveness
- Update strategy as needed
- Incorporate lessons learned
- Adapt to changing threats

### Key Monitoring Areas

#### Vulnerability Management
- Automated vulnerability scanning (weekly minimum)
- Patch management status
- Configuration baseline deviations
- Known exploit monitoring

#### Security Event Monitoring
- Log aggregation and analysis
- Security information and event management (SIEM)
- Intrusion detection/prevention
- User behavior analytics

#### Assessment and Authorization
- Control assessment status
- Authorization status
- POA&M status and aging
- Interconnection reviews

#### Threat Intelligence
- Threat feed integration
- Indicator of compromise (IOC) monitoring
- Threat actor tracking
- Attack pattern analysis

### Monitoring Frequencies
- **Real-time**: Security events, intrusion detection
- **Daily**: Log analysis, malware scanning
- **Weekly**: Vulnerability scanning, patch status
- **Monthly**: Control status, POA&M review
- **Quarterly**: Assessment updates, risk review
- **Annually**: Full control assessment, authorization review

### Automation Requirements
- Automated data collection where possible
- Integration with asset management
- Automated alerting for critical issues
- Dashboard visualization
- Trend analysis and reporting`,
  },
  {
    id: "dcsa-assessment-guidance",
    name: "DCSA Authorization Process Guidance",
    type: "guidance",
    content: `# Defense Counterintelligence and Security Agency (DCSA) Authorization Guidance

### Overview
DCSA is responsible for authorizing information systems that process classified national security information under the National Industrial Security Program (NISP).

### Authorization Requirements

#### System Registration
- Register system in DCSA's Information Systems Security Database (ISSD)
- Obtain ISSM/ISSO assignment approval
- Complete initial system categorization

#### Documentation Requirements
Systems require the following documentation:
1. **System Security Plan (SSP)** - NIST 800-171 format
2. **Security Assessment Report (SAR)**
3. **Plan of Action and Milestones (POA&M)**
4. **Configuration Management Plan**
5. **Incident Response Plan**
6. **Contingency Plan**
7. **Network Topology Diagrams**
8. **Hardware/Software Inventory**

#### Assessment Process
1. **Self-Assessment**: Organization completes NIST 800-171 self-assessment
2. **DCSA Verification**: DCSA validates assessment accuracy
3. **Remediation**: Address identified gaps
4. **Authorization Decision**: DCSA grants/denies authorization

### NIST 800-171 Compliance
Contractors must implement 110 security requirements across 14 families:
- Access Control (22 requirements)
- Awareness and Training (3 requirements)
- Audit and Accountability (9 requirements)
- Configuration Management (9 requirements)
- Identification and Authentication (11 requirements)
- Incident Response (3 requirements)
- Maintenance (6 requirements)
- Media Protection (9 requirements)
- Personnel Security (2 requirements)
- Physical Protection (6 requirements)
- Risk Assessment (3 requirements)
- Security Assessment (4 requirements)
- System and Communications Protection (16 requirements)
- System and Information Integrity (7 requirements)

### Assessment Scoring
- Each requirement scored as Met, Not Met, or Not Applicable
- POA&M required for Not Met findings
- Overall score impacts contract eligibility

### Continuous Monitoring
- Annual self-assessments required
- POA&M updates monthly
- Security incident reporting within 72 hours
- Configuration change tracking
- Vulnerability scanning (at least weekly)

### Common Findings
1. Incomplete access control procedures
2. Insufficient audit logging
3. Missing multi-factor authentication
4. Inadequate encryption for CUI
5. Lack of security awareness training documentation
6. Incomplete system boundaries
7. Missing or outdated contingency plans`,
  },
  {
    id: "stig-compliance-guide",
    name: "Security Technical Implementation Guide (STIG) Compliance",
    type: "guidance",
    content: `# Security Technical Implementation Guide (STIG) Compliance Guide

### Overview
STIGs are configuration standards developed by DISA (Defense Information Systems Agency) for securing IT systems. They contain technical guidance to lock down systems against potential threats.

### STIG Structure

#### Finding Categories
- **CAT I (High)**: Vulnerabilities that could directly result in loss of confidentiality, availability, or integrity
- **CAT II (Medium)**: Vulnerabilities that could result in loss if combined with other vulnerabilities
- **CAT III (Low)**: Vulnerabilities that degrade measures to protect against loss

#### Finding Status
- **Open**: Vulnerability exists and has not been mitigated
- **Not a Finding**: System is compliant with the requirement
- **Not Applicable**: Requirement does not apply to the system
- **Not Reviewed**: Check has not been performed

### Common STIG Categories

#### Operating System STIGs
- Windows Server 2019/2022
- Red Hat Enterprise Linux 8/9
- Ubuntu 20.04/22.04
- macOS

#### Application STIGs
- Microsoft Office
- Web browsers (Chrome, Firefox, Edge)
- Database systems (Oracle, SQL Server, PostgreSQL)
- Web servers (Apache, IIS, Nginx)

#### Network Device STIGs
- Cisco IOS
- Palo Alto Firewall
- Juniper
- Network infrastructure

### STIG Implementation Process

1. **Identify Applicable STIGs**
   - Inventory all systems and applications
   - Download current STIGs from DISA
   - Determine applicability based on system function

2. **Baseline Assessment**
   - Run automated scanning tools (SCAP Compliance Checker)
   - Document current compliance state
   - Identify gaps and deviations

3. **Remediation Planning**
   - Prioritize findings by category (CAT I first)
   - Develop remediation procedures
   - Document any required exceptions

4. **Implementation**
   - Apply configuration changes
   - Test system functionality
   - Document changes made

5. **Validation**
   - Re-scan systems after remediation
   - Verify findings are closed
   - Update compliance documentation

6. **Continuous Monitoring**
   - Schedule regular scans
   - Monitor for configuration drift
   - Update when new STIG versions released

### SCAP Scanning Tools
- DISA SCAP Compliance Checker (SCC)
- OpenSCAP
- Nessus (with DISA plugins)
- Tenable.sc

### Common STIG Findings

#### Windows Systems
- Password policy not configured
- Audit logging insufficient
- Unnecessary services enabled
- Missing security patches
- Administrator account not renamed

#### Linux Systems
- SSH configuration weaknesses
- File permissions too permissive
- AIDE/file integrity not configured
- SELinux not enforcing
- Audit daemon not configured

#### Network Devices
- Default credentials
- Unencrypted management protocols
- Missing access control lists
- Inadequate logging
- Outdated firmware`,
  },
];

// Chunk text into smaller pieces for embedding
function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  const cleanText = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const paragraphs = cleanText.split(/\n\n+/);
  
  let currentChunk = "";
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + "\n\n" + paragraph;
    } else {
      currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + paragraph;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 100);
}

// Get embeddings from OpenAI
async function getEmbeddings(texts: string[], openaiKey: string): Promise<number[][]> {
  const batchSize = 20;
  const allEmbeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: batch,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok || data.error) {
      console.error("OpenAI API error:", data.error);
      throw new Error(`OpenAI embedding error: ${data.error?.message || "Unknown error"}`);
    }
    
    const sortedData = data.data.sort((a: any, b: any) => a.index - b.index);
    allEmbeddings.push(...sortedData.map((item: any) => item.embedding));
  }
  
  return allEmbeddings;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user and company
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("User profile not found");
    }

    console.log(`Starting knowledge base seeding for company: ${profile.company_id}`);

    const results: { document: string; chunks: number; tokens: number; success: boolean; error?: string }[] = [];

    for (const doc of SEED_DOCUMENTS) {
      try {
        console.log(`Processing document: ${doc.name}`);

        // Delete existing embeddings for this document
        await supabase
          .from("document_embeddings")
          .delete()
          .eq("document_id", doc.id)
          .eq("company_id", profile.company_id);

        // Chunk the content
        const chunks = chunkText(doc.content);
        
        if (chunks.length === 0) {
          results.push({ document: doc.name, chunks: 0, tokens: 0, success: false, error: "No valid chunks" });
          continue;
        }

        console.log(`  - Created ${chunks.length} chunks`);

        // Get embeddings
        const embeddings = await getEmbeddings(chunks, openaiKey);
        console.log(`  - Generated ${embeddings.length} embeddings`);

        // Prepare records
        const records = chunks.map((chunk, index) => ({
          company_id: profile.company_id,
          document_id: doc.id,
          document_name: doc.name,
          document_type: doc.type,
          chunk_index: index,
          chunk_text: chunk,
          embedding: embeddings[index],
          token_count: estimateTokens(chunk),
          metadata: {
            source: "seed",
            seeded_at: new Date().toISOString(),
          },
        }));

        // Insert in batches
        const batchSize = 50;
        let totalInserted = 0;
        
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          const { error: insertError } = await supabase
            .from("document_embeddings")
            .insert(batch);

          if (insertError) {
            throw new Error(`Insert error: ${insertError.message}`);
          }
          totalInserted += batch.length;
        }

        const totalTokens = records.reduce((sum, r) => sum + (r.token_count || 0), 0);
        results.push({ document: doc.name, chunks: totalInserted, tokens: totalTokens, success: true });
        
        console.log(`  - Successfully inserted ${totalInserted} chunks (${totalTokens} tokens)`);

      } catch (docError) {
        console.error(`Error processing ${doc.name}:`, docError);
        results.push({ 
          document: doc.name, 
          chunks: 0, 
          tokens: 0, 
          success: false, 
          error: docError instanceof Error ? docError.message : "Unknown error" 
        });
      }
    }

    // Log audit event
    await supabase.rpc("log_audit_event", {
      p_company_id: profile.company_id,
      p_user_id: user.id,
      p_action: "create",
      p_resource_type: "knowledge_base",
      p_resource_id: "seed",
      p_resource_name: "RMF Knowledge Base Seed",
      p_details: {
        documents_processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        total_chunks: results.reduce((sum, r) => sum + r.chunks, 0),
        total_tokens: results.reduce((sum, r) => sum + r.tokens, 0),
      },
    });

    const summary = {
      success: true,
      total_documents: results.length,
      successful_documents: results.filter(r => r.success).length,
      failed_documents: results.filter(r => !r.success).length,
      total_chunks: results.reduce((sum, r) => sum + r.chunks, 0),
      total_tokens: results.reduce((sum, r) => sum + r.tokens, 0),
      details: results,
    };

    console.log("Seeding complete:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Seed knowledge base error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      {
        status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
