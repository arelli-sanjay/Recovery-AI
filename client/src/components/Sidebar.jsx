import {
  LayoutDashboard,
  AlertTriangle,
  RefreshCcw,
  Bot,
  CreditCard,
  Users,
  BarChart3,
  ShieldCheck,
  BellRing,
  Zap,
} from "lucide-react";

import { useEffect, useState } from "react";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    label: "At-Risk Revenue",
    icon: AlertTriangle,
    path: "/at-risk-revenue",
  },
  {
    label: "Recovery Cases",
    icon: RefreshCcw,
    path: "/recovery-cases",
  },
  {
    label: "AI Recovery Agent",
    icon: Bot,
    path: "/ai-recovery-agent",
  },
  {
    label: "Payments",
    icon: CreditCard,
    path: "/payments",
  },
  {
    label: "Customers",
    icon: Users,
    path: "/customers",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    path: "/analytics",
  },
  {
    label: "Audit Trail",
    icon: ShieldCheck,
    path: "/audit-trail",
  },
  {
    label: "Escalations",
    icon: BellRing,
    path: "/escalations",
  },
];

export default function Sidebar() {
  const [currentPath, setCurrentPath] = useState(
    window.location.pathname
  );

  // NAVIGATION
  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);

    window.dispatchEvent(
      new PopStateEvent("popstate")
    );
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  return (
    <aside className="sidebar">
      {/* BRAND */}
      <div className="brand">
        <div className="brand-icon">
          <Zap size={22} />
        </div>

        <div>
          <h2>RECOVERY AI</h2>
          <span>Recover More. Lose Less.</span>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <button
              key={item.label}
              className={`nav-item ${
                isActive ? "active" : ""
              }`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* SIDEBAR BOTTOM */}
      <div className="sidebar-bottom">
        {/* AI AGENT */}
        <div className="agent-card">
          <div className="agent-header">
            <span>AI AGENT STATUS</span>
            <div className="status-dot"></div>
          </div>

          <div className="agent-icon">
            <Bot size={38} />
          </div>

          <div className="agent-status">
            <span className="online-dot"></span>
            ACTIVE
          </div>

          <p>Monitoring · Analyzing · Recovering</p>

          <small>Always on to recover revenue</small>
        </div>

        {/* SYSTEM HEALTH */}
        <div className="system-card">
          <span>SYSTEM HEALTH</span>

          <div className="mini-chart">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>

          <div className="system-status">
            <span></span>
            All Systems Operational
          </div>
        </div>
      </div>
    </aside>
  );
}