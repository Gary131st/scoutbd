import { Link, useLocation } from "react-router-dom";
import { Home, Shield, BookOpen, HelpCircle, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const MobileBottomNav = () => {
  const location = useLocation();
  const { user, role } = useAuth();

  const dashboardPath = role === "admin" ? "/admin" : role === "scout" ? "/scout" : "/player";

  const links = [
    { label: "Home", path: "/", Icon: Home },
    { label: "Safe", path: "/safe-scouting", Icon: Shield },
    { label: "Mission", path: "/mission", Icon: BookOpen },
    { label: "FAQ", path: "/faq", Icon: HelpCircle },
    ...(user ? [{ label: "Dashboard", path: dashboardPath, Icon: LayoutDashboard }] : []),
  ];

  // Hide on auth, reset-password pages
  const hidden = ["/auth", "/reset-password"].includes(location.pathname);
  if (hidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border"
      style={{ background: "hsl(0 0% 6% / 0.97)", backdropFilter: "blur(16px)" }}
    >
      <div className="flex items-center justify-around h-16 px-1 safe-area-inset-bottom">
        {links.map(({ label, path, Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`} />
              <span className="text-[10px] font-medium">{label}</span>
              {active && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-foreground" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
