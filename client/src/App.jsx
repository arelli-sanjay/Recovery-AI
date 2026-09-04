import { useEffect, useState } from "react";

import Dashboard from "./pages/Dashboard";
import AtRiskRevenue from "./pages/AtRiskRevenue";
import RecoveryCases from "./pages/RecoveryCases";
import AIRecoveryAgent from "./pages/AIRecoveryAgent";
import Payments from "./pages/Payments";
import Customers from "./pages/Customers";
import Analytics from "./pages/Analytics";
import AuditTrail from "./pages/AuditTrail";
import Escalations from "./pages/Escalations";

function App() {

  const [path, setPath] = useState(
    window.location.pathname
  );

  useEffect(() => {

    const handleNavigation = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener(
      "popstate",
      handleNavigation
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handleNavigation
      );
    };

  }, []);

    if (path === "/at-risk-revenue") {
    return <AtRiskRevenue />;
  }

  if (path === "/recovery-cases") {
    return <RecoveryCases />;
  }

  if (path === "/ai-recovery-agent") {
  return <AIRecoveryAgent />;
}

if (path === "/payments") {
  return <Payments />;
}

if (path === "/customers") {
  return <Customers />;
}

if (path === "/analytics"){
   return <Analytics />;
}

if (path === "/audit-trail") {
  return <AuditTrail />;
}

if (path === "/escalations") {
  return <Escalations />;
}

  return <Dashboard />;
}

export default App;