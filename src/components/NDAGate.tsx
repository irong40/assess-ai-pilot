
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNDAStatus } from "@/hooks/useNDAStatus";
import Loading from "@/components/Loading";

interface NDAGateProps {
  children: React.ReactNode;
}

const NDAGate = ({ children }: NDAGateProps) => {
  const { user, loading: authLoading } = useAuth();
  const { ndaAccepted } = useNDAStatus();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!authLoading && user && ndaAccepted === false) {
      setRedirecting(true);
      setTimeout(() => {
        navigate("/nda");
      }, 1000);
    }
  }, [user, authLoading, ndaAccepted, navigate]);

  if (authLoading || ndaAccepted === null) {
    return <Loading fullScreen text="Checking access requirements..." />;
  }

  if (user && ndaAccepted === false && redirecting) {
    return <Loading fullScreen text="Redirecting to NDA agreement..." />;
  }

  if (user && ndaAccepted === false) {
    return null;
  }

  return <>{children}</>;
};

export default NDAGate;
