
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
      path="/assessment/:id/agent/policy"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentPolicy />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/access"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentAccess />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/network"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentNetwork />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/data"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentData />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/privacy"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentPrivacy />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/recovery"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentRecovery />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/mobile"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentMobile />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/training"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentTraining />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/supply-chain"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentSupplyChain />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/threat-intel"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentThreatIntel />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/physical"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentPhysical />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/incident"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentIncident />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/vulnerability"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentVulnerability />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/compliance"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentCompliance />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/blue-team"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentBlueTeam />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/configuration"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentConfiguration />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/continuity"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentContinuity />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/grc"
      element={
        <ProtectedRoute>
          <NDAGate>
            <AgentGRC />
          </NDAGate>
        </ProtectedRoute>
      }
    />
    <Route
      path="/assessment/:id/agent/legal"
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
