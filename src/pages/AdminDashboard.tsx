import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Video, DollarSign, CheckCircle, XCircle, Clock, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ScoutRow {
  id: string;
  user_id: string;
  organization: string | null;
  verification_status: string;
  created_at: string;
  full_name?: string;
}

interface VideoRow {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  video_url: string | null;
  status: string;
  created_at: string;
  full_name?: string;
}

interface Stats {
  totalPlayers: number;
  totalScouts: number;
  activeScouts: number;
  pendingScouts: number;
  liveVideos: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [scouts, setScouts] = useState<ScoutRow[]>([]);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== "admin") {
      navigate("/");
      return;
    }
    fetchAll();
  }, [user, role, authLoading]);

  const fetchAll = async () => {
    setLoading(true);
    const [scoutRes, videoRes, roleRes, paymentRes] = await Promise.all([
      supabase.from("scout_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("videos").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("role"),
      supabase.from("payments").select("amount, status"),
    ]);

    const scoutData = scoutRes.data || [];
    const videoData = videoRes.data || [];
    const roles = roleRes.data || [];
    const payments = paymentRes.data || [];

    // Fetch names for scouts
    const scoutUserIds = scoutData.map((s) => s.user_id);
    const videoUserIds = [...new Set(videoData.map((v) => v.user_id))];
    const allUserIds = [...new Set([...scoutUserIds, ...videoUserIds])];

    let profileMap = new Map<string, string>();
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", allUserIds);
      (profiles || []).forEach((p) => profileMap.set(p.user_id, p.full_name));
    }

    setScouts(scoutData.map((s) => ({ ...s, full_name: profileMap.get(s.user_id) || "Unknown" })));
    setVideos(videoData.map((v) => ({ ...v, full_name: profileMap.get(v.user_id) || "Unknown" })));

    setStats({
      totalPlayers: roles.filter((r) => r.role === "player").length,
      totalScouts: roles.filter((r) => r.role === "scout").length,
      activeScouts: scoutData.filter((s) => s.verification_status === "active").length,
      pendingScouts: scoutData.filter((s) => s.verification_status === "pending").length,
      liveVideos: videoData.filter((v) => v.status === "live").length,
      totalRevenue: payments.filter((p) => p.status === "success").reduce((sum, p) => sum + Number(p.amount), 0),
    });

    setLoading(false);
  };

  const updateScoutStatus = async (scoutId: string, status: "active" | "rejected") => {
    const { error } = await supabase
      .from("scout_profiles")
      .update({ verification_status: status })
      .eq("id", scoutId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Scout ${status === "active" ? "approved" : "rejected"}` });
      fetchAll();
    }
  };

  const updateVideoStatus = async (videoId: string, status: "live" | "rejected") => {
    const { error } = await supabase
      .from("videos")
      .update({ status })
      .eq("id", videoId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Video ${status === "live" ? "approved" : "rejected"}` });
      fetchAll();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="font-display text-4xl text-foreground">ADMIN PANEL</h1>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Players", value: stats.totalPlayers, icon: Users, color: "text-primary" },
                { label: "Scouts", value: `${stats.activeScouts}/${stats.totalScouts}`, icon: Shield, color: "text-primary" },
                { label: "Live Videos", value: stats.liveVideos, icon: Video, color: "text-primary" },
                { label: "Revenue", value: `৳${stats.totalRevenue}`, icon: DollarSign, color: "text-primary" },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</span>
                  </div>
                  <p className="font-display text-3xl text-foreground">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <Tabs defaultValue="scouts" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="scouts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Scout Verification ({stats?.pendingScouts || 0} pending)
              </TabsTrigger>
              <TabsTrigger value="videos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Video Moderation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scouts" className="space-y-3">
              {scouts.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No scout registrations yet.</p>
              ) : (
                scouts.map((s) => (
                  <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.organization || "No organization"} • {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={
                          s.verification_status === "active"
                            ? "bg-primary/20 text-primary border-primary/30"
                            : s.verification_status === "pending"
                            ? "bg-accent/20 text-accent-foreground border-accent/30"
                            : "bg-destructive/20 text-destructive border-destructive/30"
                        }
                      >
                        {s.verification_status === "active" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {s.verification_status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {s.verification_status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                        {s.verification_status}
                      </Badge>
                      {s.verification_status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => updateScoutStatus(s.id, "active")} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateScoutStatus(s.id, "rejected")} className="border-destructive/40 text-destructive hover:bg-destructive/10">
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="videos" className="space-y-3">
              {videos.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No videos submitted yet.</p>
              ) : (
                videos.map((v) => (
                  <div key={v.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{v.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {v.description || "No description"} • {new Date(v.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={
                          v.status === "live"
                            ? "bg-primary/20 text-primary border-primary/30"
                            : v.status === "rejected"
                            ? "bg-destructive/20 text-destructive border-destructive/30"
                            : "bg-muted text-muted-foreground border-border"
                        }
                      >
                        {v.status}
                      </Badge>
                      {v.video_url && (
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/resume/${v.user_id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {(v.status === "pending_payment" || v.status === "draft") && (
                        <>
                          <Button size="sm" onClick={() => updateVideoStatus(v.id, "live")} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateVideoStatus(v.id, "rejected")} className="border-destructive/40 text-destructive hover:bg-destructive/10">
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
