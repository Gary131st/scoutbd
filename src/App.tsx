import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PlayerDashboard from "./pages/PlayerDashboard";
import ScoutDashboard from "./pages/ScoutDashboard";
import PlayerResume from "./pages/PlayerResume";
import SafeScouting from "./pages/SafeScouting";
import Mission from "./pages/Mission";
import FAQ from "./pages/FAQ";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.985 },
  animate: { 
    opacity: 1, y: 0, scale: 1, 
    transition: { duration: 0.45, ease: "easeOut" as const } 
  },
  exit: { 
    opacity: 0, y: -12, scale: 0.985, 
    transition: { duration: 0.28, ease: "easeIn" as const } 
  },
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ transformStyle: "preserve-3d", willChange: "transform, opacity" }}
        className="w-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/player" element={<ProtectedRoute allowedRoles={["player"]}><PlayerDashboard /></ProtectedRoute>} />
          <Route path="/scout" element={<ProtectedRoute allowedRoles={["scout"]}><ScoutDashboard /></ProtectedRoute>} />
          <Route path="/resume/:userId" element={<PlayerResume />} />
          <Route path="/safe-scouting" element={<SafeScouting />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <AnimatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
