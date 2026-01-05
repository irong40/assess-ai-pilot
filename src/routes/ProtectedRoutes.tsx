import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import NDAGate from "@/components/NDAGate";
import Dashboard from "@/pages/Dashboard";
import NewAssessment from "@/pages/NewAssessment";
import AgentHub from "@/pages/AgentHub";
import ReportBuilder from "@/pages/ReportBuilder";
import LeadSummary from "@/pages/LeadSummary";
import ISSMReview from "@/pages/ISSMReview";
import Feedback from "@/pages/Feedback";
import Admin from "@/pages/Admin";
import RAGChatInterface from "@/components/rag/RAGChatInterface";
import POAMManager from "@/components/poam/POAMManager";
import AuditLogViewer from "@/components/audit/AuditLogViewer";
import DocumentManagement from "@/pages/DocumentManagement";
import WizardHub from "@/pages/WizardHub";
import SelfAssessmentWizard from "@/pages/SelfAssessmentWizard";
import AssessmentResults from "@/pages/AssessmentResults";

const ProtectedRoutes = () => (
  <>
    <Route
      path="/admin"
      element={
        <ProtectedRoute>
          <RoleBasedRoute requiredRoles={['admin']}>
            <Admin />
          </RoleBasedRoute>
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <NDAGate>
            <Dashboard />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/new-assessment"
      element={
        <ProtectedRoute>
          <NDAGate>
            <NewAssessment />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentHub />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/wizard"
      element={
        <ProtectedRoute>
          <NDAGate>
            <WizardHub />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/wizard/:domainId"
      element={
        <ProtectedRoute>
          <NDAGate>
            <SelfAssessmentWizard />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/results"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AssessmentResults />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/summary"
      element={
        <ProtectedRoute>
          <NDAGate>
            <RoleBasedRoute requiredRoles={['admin', 'isso']}>
              <LeadSummary />
            </RoleBasedRoute>
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/issm-review"
      element={
        <ProtectedRoute>
          <NDAGate>
            <RoleBasedRoute requiredRoles={['admin', 'issm']}>
              <ISSMReview />
            </RoleBasedRoute>
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/report"
      element={
        <ProtectedRoute>
          <NDAGate>
            <ReportBuilder />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/feedback"
      element={
        <ProtectedRoute>
          <NDAGate>
            <Feedback />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/compliance/rag"
      element={
        <ProtectedRoute>
          <NDAGate>
            <RAGChatInterface />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/compliance/poam"
      element={
        <ProtectedRoute>
          <NDAGate>
            <POAMManager />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/compliance/audit"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AuditLogViewer />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/compliance/documents"
      element={
        <ProtectedRoute>
          <NDAGate>
            <DocumentManagement />
          </NDAGate>
        </ProtectedRoute>
      }
    />
  </>
);

export default ProtectedRoutes;
