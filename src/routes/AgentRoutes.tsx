
import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import NDAGate from "@/components/NDAGate";
import AgentPolicy from "@/pages/AgentPolicy";
import AgentAccess from "@/pages/AgentAccess";
import AgentNetwork from "@/pages/AgentNetwork";
import AgentData from "@/pages/AgentData";
import AgentPrivacy from "@/pages/AgentPrivacy";
import AgentRecovery from "@/pages/AgentRecovery";
import AgentMobile from "@/pages/AgentMobile";
import AgentTraining from "@/pages/AgentTraining";
import AgentSupplyChain from "@/pages/AgentSupplyChain";
import AgentThreatIntel from "@/pages/AgentThreatIntel";
import AgentPhysical from "@/pages/AgentPhysical";
import AgentIncident from "@/pages/AgentIncident";
import AgentVulnerability from "@/pages/AgentVulnerability";
import AgentCompliance from "@/pages/AgentCompliance";
import AgentBlueTeam from "@/pages/AgentBlueTeam";
import AgentConfiguration from "@/pages/AgentConfiguration";
import AgentContinuity from "@/pages/AgentContinuity";
import AgentGRC from "@/pages/AgentGRC";
import AgentLegal from "@/pages/AgentLegal";

const AgentRoutes = () => (
  <>
    <Route
      path="/assessment/:id/agents/policy"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentPolicy />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/access"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentAccess />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/network"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentNetwork />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/data"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentData />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/privacy"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentPrivacy />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/recovery"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentRecovery />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/mobile"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentMobile />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/training"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentTraining />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/supply-chain"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentSupplyChain />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/threat-intel"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentThreatIntel />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/physical"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentPhysical />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/incident"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentIncident />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/vulnerability"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentVulnerability />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/compliance"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentCompliance />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/blue-team"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentBlueTeam />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/configuration"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentConfiguration />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/continuity"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentContinuity />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/grc"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentGRC />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agents/legal"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentLegal />
          </NDAGate>
        </ProtectedRoute>
      }
    />
  </>
);

export default AgentRoutes;
