
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewAssessment from "./pages/NewAssessment";
import AgentHub from "./pages/AgentHub";
import AgentPolicy from "./pages/AgentPolicy";
import AgentPhysical from "./pages/AgentPhysical";
import AgentNetwork from "./pages/AgentNetwork";
import AgentAccess from "./pages/AgentAccess";
import AgentData from "./pages/AgentData";
import AgentIncident from "./pages/AgentIncident";
import AgentCompliance from "./pages/AgentCompliance";
import AgentVulnerability from "./pages/AgentVulnerability";
import AgentTraining from "./pages/AgentTraining";
import AgentContinuity from "./pages/AgentContinuity";
import LeadSummary from "./pages/LeadSummary";
import ISSMReview from "./pages/ISSMReview";
import ReportBuilder from "./pages/ReportBuilder";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "@/components/ErrorBoundary";
import React from 'react';

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <div className="min-h-screen">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/assessment/new" element={<ProtectedRoute><NewAssessment /></ProtectedRoute>} />
                <Route path="/assessment/:id/agents" element={<ProtectedRoute><AgentHub /></ProtectedRoute>} />
                <Route path="/assessment/:id/agents/policy" element={<ProtectedRoute><AgentPolicy /></ProtectedRoute>} />
                <Route path="/assessment/:id/agents/physical" element={<ProtectedRoute><AgentPhysical /></ProtectedRoute>} />
                <Route path="/assessment/:id/agents/network" element={<ProtectedRoute><AgentNetwork /></ProtectedRoute>} />
                <Route path="/assessment/:id/agents/access" element={<ProtectedRoute><AgentAccess /></ProtectedRoute>} />
                <Route path="/assessment/:id/agents/data" element={<ProtectedRoute><AgentData /></ProtectedRoute>} />
                <Route path="/assessment/:id/agents/incident" element={<ProtectedRoute><AgentIncident /></ProtectedRoute>} />
                <Route path="/assessment/:id/agents/compliance" element={<ProtectedRoute><AgentCompliance /></ProtectedRoute>} />
                <Route path="/assessment/:id/agents/vulnerability" element={<ProtectedRoute><AgentVulnerability /></ProtectedRoute>} />
                <Route path="/assessment/:id/agents/training" element={<ProtectedRoute><AgentTraining /></ProtectedRoute>} />
                <Route path="/assessment/:id/agents/continuity" element={<ProtectedRoute><AgentContinuity /></ProtectedRoute>} />
                <Route path="/assessment/:id/summary" element={<ProtectedRoute><LeadSummary /></ProtectedRoute>} />
                <Route path="/assessment/:id/lead-summary" element={<ProtectedRoute><LeadSummary /></ProtectedRoute>} />
                <Route path="/assessment/:id/issm-review" element={<ProtectedRoute><ISSMReview /></ProtectedRoute>} />
                <Route path="/assessment/:id/report" element={<ProtectedRoute><ReportBuilder /></ProtectedRoute>} />
                <Route path="/assessment/:id/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <Sonner />
            </div>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
