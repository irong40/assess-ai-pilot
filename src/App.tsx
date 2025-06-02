
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SupabaseAuthProvider } from "./integrations/supabase/auth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NewAssessment from "./pages/NewAssessment";
import AgentHub from "./pages/AgentHub";
import AgentPolicy from "./pages/AgentPolicy";
import AgentAccess from "./pages/AgentAccess";
import AgentNetwork from "./pages/AgentNetwork";
import AgentData from "./pages/AgentData";
import AgentPrivacy from "./pages/AgentPrivacy";
import AgentRecovery from "./pages/AgentRecovery";
import AgentMobile from "./pages/AgentMobile";
import AgentTraining from "./pages/AgentTraining";
import AgentSupplyChain from "./pages/AgentSupplyChain";
import AgentThreatIntel from "./pages/AgentThreatIntel";
import AgentPhysical from "./pages/AgentPhysical";
import AgentIncident from "./pages/AgentIncident";
import AgentVulnerability from "./pages/AgentVulnerability";
import AgentCompliance from "./pages/AgentCompliance";
import AgentBlueTeam from "./pages/AgentBlueTeam";
import AgentConfiguration from "./pages/AgentConfiguration";
import AgentContinuity from "./pages/AgentContinuity";
import AgentGRC from "./pages/AgentGRC";
import AgentLegal from "./pages/AgentLegal";
import Auth from "./pages/Auth";
import ReportBuilder from "./pages/ReportBuilder";
import LeadSummary from "./pages/LeadSummary";
import ISSMReview from "./pages/ISSMReview";
import Feedback from "./pages/Feedback";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SupabaseAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/help" element={<Help />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-assessment"
              element={
                <ProtectedRoute>
                  <NewAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agents"
              element={
                <ProtectedRoute>
                  <AgentHub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/policy"
              element={
                <ProtectedRoute>
                  <AgentPolicy />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/access"
              element={
                <ProtectedRoute>
                  <AgentAccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/network"
              element={
                <ProtectedRoute>
                  <AgentNetwork />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/data"
              element={
                <ProtectedRoute>
                  <AgentData />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/privacy"
              element={
                <ProtectedRoute>
                  <AgentPrivacy />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/recovery"
              element={
                <ProtectedRoute>
                  <AgentRecovery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/mobile"
              element={
                <ProtectedRoute>
                  <AgentMobile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/training"
              element={
                <ProtectedRoute>
                  <AgentTraining />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/supply-chain"
              element={
                <ProtectedRoute>
                  <AgentSupplyChain />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/threat-intel"
              element={
                <ProtectedRoute>
                  <AgentThreatIntel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/physical"
              element={
                <ProtectedRoute>
                  <AgentPhysical />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/incident"
              element={
                <ProtectedRoute>
                  <AgentIncident />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/vulnerability"
              element={
                <ProtectedRoute>
                  <AgentVulnerability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/compliance"
              element={
                <ProtectedRoute>
                  <AgentCompliance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/blue-team"
              element={
                <ProtectedRoute>
                  <AgentBlueTeam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/configuration"
              element={
                <ProtectedRoute>
                  <AgentConfiguration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/continuity"
              element={
                <ProtectedRoute>
                  <AgentContinuity />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/grc"
              element={
                <ProtectedRoute>
                  <AgentGRC />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/agent/legal"
              element={
                <ProtectedRoute>
                  <AgentLegal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/summary"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin', 'isso-lead']}>
                    <LeadSummary />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id/issm-review"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin', 'issm']}>
                    <ISSMReview />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-builder/:id"
              element={
                <ProtectedRoute>
                  <ReportBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <Feedback />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SupabaseAuthProvider>
  </QueryClientProvider>
);

export default App;
