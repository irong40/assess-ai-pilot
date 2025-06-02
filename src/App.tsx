
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assessment/new" element={<NewAssessment />} />
          <Route path="/assessment/:id/agents" element={<AgentHub />} />
          <Route path="/assessment/:id/agents/policy" element={<AgentPolicy />} />
          <Route path="/assessment/:id/agents/physical" element={<AgentPhysical />} />
          <Route path="/assessment/:id/agents/network" element={<AgentNetwork />} />
          <Route path="/assessment/:id/agents/access" element={<AgentAccess />} />
          <Route path="/assessment/:id/agents/data" element={<AgentData />} />
          <Route path="/assessment/:id/agents/incident" element={<AgentIncident />} />
          <Route path="/assessment/:id/agents/compliance" element={<AgentCompliance />} />
          <Route path="/assessment/:id/agents/vulnerability" element={<AgentVulnerability />} />
          <Route path="/assessment/:id/agents/training" element={<AgentTraining />} />
          <Route path="/assessment/:id/agents/continuity" element={<AgentContinuity />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
