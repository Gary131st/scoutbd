import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import NotificationBell from "@/components/NotificationBell";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Safe Scouting", path: "/safe-scouting" },
  { label: "Our Mission", path: "/mission" },
  { label: "FAQ", path: "/faq" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setScrolled(current > 40);
      if (current > 80 && current > lastScrollY.current) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50"
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: scrolled
          ? "rgba(255,255,255,0.08)"
          : "transparent",
        backdropFilter: scrolled ? "blur(28px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(28px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.1)" : "none",
        transition: "background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease",
      }}
    >
      <div className="container flex items-center justify-between h-16 gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Zap className="h-5 w-5" style={{ color: "hsl(var(--green))" }} />
          <span className="font-display text-xl sm:text-2xl tracking-wider"
            style={{ color: scrolled ? "hsl(var(--foreground))" : "rgba(255,255,255,0.95)" }}>
            SCOUT <span style={{ color: "hsl(var(--green))" }}>BD</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-5 lg:gap-6">
          {navLinks.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className="text-sm font-medium transition-colors whitespace-nowrap"
              style={{
                color: location.pathname === l.path
                  ? "hsl(var(--green))"
                  : scrolled ? "hsl(var(--muted-foreground))" : "rgba(255,255,255,0.7)",
              }}
            >
              {l.label}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-2 shrink-0">
              <NotificationBell />
              <Link to={role === "admin" ? "/admin" : role === "scout" ? "/scout" : "/player"}>
                <button
                  className="text-xs font-bold tracking-wide px-4 py-2 rounded-full transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    backdropFilter: "blur(12px)",
                    color: scrolled ? "hsl(var(--foreground))" : "rgba(255,255,255,0.92)",
                  }}
                >
                  Dashboard
                </button>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: scrolled ? "hsl(var(--muted-foreground))" : "rgba(255,255,255,0.6)",
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="shrink-0">
              <button
                className="text-xs font-bold tracking-wide px-5 py-2 rounded-full transition-all duration-200"
                style={{
                  background: "hsl(var(--green))",
                  color: "#fff",
                  boxShadow: "0 2px 16px hsl(var(--green) / 0.4)",
                }}
              >
                Get Started
              </button>
            </Link>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200"
            aria-label="Toggle theme"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
              color: scrolled ? "hsl(var(--foreground))" : "rgba(255,255,255,0.75)",
            }}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200"
            aria-label="Toggle theme"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: scrolled ? "hsl(var(--foreground))" : "rgba(255,255,255,0.75)",
            }}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200"
            onClick={() => setOpen(!open)}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: scrolled ? "hsl(var(--foreground))" : "rgba(255,255,255,0.85)",
            }}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28 }}
            className="md:hidden overflow-hidden"
            style={{
              background: "rgba(10,10,10,0.75)",
              backdropFilter: "blur(32px) saturate(180%)",
              WebkitBackdropFilter: "blur(32px) saturate(180%)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="container py-5 flex flex-col gap-3">
              {navLinks.map((l) => (
                <Link
                  key={l.path}
                  to={l.path}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium py-2 transition-colors"
                  style={{ color: location.pathname === l.path ? "hsl(var(--green))" : "rgba(255,255,255,0.65)" }}
                >
                  {l.label}
                </Link>
              ))}
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    <NotificationBell />
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Notifications</span>
                  </div>
                  <Link to={role === "admin" ? "/admin" : role === "scout" ? "/scout" : "/player"} onClick={() => setOpen(false)}>
                    <button className="w-full text-sm font-bold py-2.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }}>
                      Dashboard
                    </button>
                  </Link>
                  <button onClick={() => { handleSignOut(); setOpen(false); }}
                    className="text-sm py-2 text-left transition-colors"
                    style={{ color: "rgba(255,255,255,0.5)" }}>
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)}>
                  <button className="w-full text-sm font-bold py-2.5 rounded-full"
                    style={{ background: "hsl(var(--green))", color: "#fff" }}>
                    Get Started
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
