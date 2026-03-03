import { Link, useLocation } from "react-router-dom";
import { Home, Shield, BookOpen, HelpCircle, Upload, Eye, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const MobileBottomNav = () => {
  const location = useLocation();
  const { user, role } = useAuth();

  // Player-specific bottom nav with deep-link tabs via hash
  const isPlayer = user && role === "player";
  const isScout = user && role === "scout";
  const isAdmin = user && role === "admin";

  let links;
  if (isPlayer) {
    links = [
      { label: "Home", path: "/", Icon: Home },
      { label: "Upload", path: "/player/upload", Icon: Upload },
      { label: "Explore", path: "/player/explore", Icon: Eye },
      { label: "Profile", path: "/player/profile", Icon: User },
    ];
  } else if (isScout || isAdmin) {
    const dashPath = isAdmin ? "/admin" : "/scout";
    links = [
      { label: "Home", path: "/", Icon: Home },
      { label: "Safe", path: "/safe-scouting", Icon: Shield },
      { label: "Mission", path: "/mission", Icon: BookOpen },
      { label: "Dashboard", path: dashPath, Icon: User },
    ];
  } else {
    links = [
      { label: "Home", path: "/", Icon: Home },
      { label: "Safe", path: "/safe-scouting", Icon: Shield },
      { label: "Mission", path: "/mission", Icon: BookOpen },
      { label: "FAQ", path: "/faq", Icon: HelpCircle },
    ];
  }

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
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative ${
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
