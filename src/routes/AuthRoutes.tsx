
import { Route } from "react-router-dom";
import Auth from "@/pages/Auth";
import Help from "@/pages/Help";
import Index from "@/pages/Index";
import NDA from "@/pages/NDA";

const AuthRoutes = () => (
  <>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/help" element={<Help />} />
  </>
);

export default AuthRoutes;
