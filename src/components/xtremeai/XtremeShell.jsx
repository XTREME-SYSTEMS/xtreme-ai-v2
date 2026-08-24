import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Hammer, Palette, Rocket, Menu, ChevronLeft, Sun, Moon, X,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import { XTREME_AI_LOGO } from "@/lib/brandAssets";
import { useTheme } from "@/lib/ThemeContext";

// Bottom tab groups — each tab covers a set of step routes
const TABS = [
  {
    to: "/portal-studio", label: "Home", icon: Home, exact: true,
  },
  {
    to: "/portal-studio/business-name", label: "Build", icon: Hammer,
    match: ["/portal-studio/business-name", "/portal-studio/business-profile", "/portal-studio/content", "/portal-studio/website"],
  },
  {
    to: "/portal-studio/logo", label: "Brand", icon: Palette,
    match: ["/portal-studio/logo", "/portal-studio/brand", "/portal-studio/social", "/portal-studio/video"],
  },
  {
    to: "/portal-studio/your-designs", label: "Launch", icon: Rocket,
    match: ["/portal-studio/your-designs", "/portal-studio/signatures", "/portal-studio/approvals", "/portal-studio/launch", "/portal-studio/enhancements"],
  },
];

const MORE_ITEMS = [
  { to: "/portal-studio/welcome", label: "Welcome" },
  { to: "/portal-studio/business-name", label: "Business Name" },
  { to: "/portal-studio/business-profile", label: "Business Profile" },
  { to: "/portal-studio/content", label: "Content" },
  { to: "/portal-studio/logo", label: "Logo" },
  { to: "/portal-studio/brand", label: "Brand" },
  { to: "/portal-studio/website", label: "Website" },
  { to: "/portal-studio/social", label: "Social Media" },
  { to: "/portal-studio/video", label: "Video" },
  { to: "/portal-studio/enhancements", label: "Enhancements" },
  { to: "/portal-studio/your-designs", label: "Your Designs" },
  { to: "/portal-studio/signatures", label: "Signatures" },
  { to: "/portal-studio/approvals", label: "Approvals" },
  { to: "/portal-studio/launch", label: "Launch" },
];

export default function XtremeShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolved, toggle } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (tab) => {
    if (tab.exact) return location.pathname === tab.to;
    if (tab.match) return tab.match.some((m) => location.pathname.startsWith(m));
    return location.pathname.startsWith(tab.to);
  };

  const onTab = TABS.some(isActive);
  const showBack = !onTab && location.pathname !== "/portal-studio";

  return (
    <div className="xa-stage">
      <div className="xa-device">
        <div className="xa-screen">
          {/* Brandbar */}
          <div className="xa-brandbar">
            <div className="xa-brandbar-left">
              {showBack && (
                <button onClick={() => navigate(-1)} className="xa-back-btn" aria-label="Back">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <Image
                src={XTREME_AI_LOGO}
                alt="Xtreme AI"
                className="xa-brandbar-logo"
                fittingType="fit"
              />
              <span className="xa-brandbar-name">Xtreme AI</span>
            </div>
            <div className="xa-brandbar-right">
              <button onClick={toggle} className="xa-icon-btn" aria-label="Toggle theme">
                {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="xa-main">
            <Outlet />
          </div>

          {/* Bottom Tab Bar */}
          <nav className="xa-nav">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.to}
                  className={isActive(tab) ? "active" : ""}
                  onClick={() => navigate(tab.to)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
            <button
              className={moreOpen ? "active" : ""}
              onClick={() => setMoreOpen(!moreOpen)}
            >
              <Menu className="h-5 w-5" />
              <span>More</span>
            </button>
          </nav>
        </div>

        {/* More Drawer */}
        {moreOpen && (
          <div className="xa-drawer-overlay" onClick={() => setMoreOpen(false)}>
            <div className="xa-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="xa-drawer-header">
                <h3>All Tools</h3>
                <button onClick={() => setMoreOpen(false)} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="xa-drawer-list">
                {MORE_ITEMS.map((item) => (
                  <button
                    key={item.to}
                    className={location.pathname === item.to ? "active" : ""}
                    onClick={() => {
                      navigate(item.to);
                      setMoreOpen(false);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}