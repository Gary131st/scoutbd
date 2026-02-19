import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
