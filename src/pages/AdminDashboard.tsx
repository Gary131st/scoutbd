import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Video, DollarSign, CheckCircle, XCircle, Clock, Loader2, Eye, AlertTriangle, MessageSquare, UserPlus, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import ProfileTab from "@/components/ProfileTab";
import AdminNoticeForm from "@/components/AdminNoticeForm";

interface ScoutRow { id: string; user_id: string; organization: string | null; verification_status: string; created_at: string; full_name?: string; }
interface VideoRow { id: string; user_id: string; title: string | null; description: string | null; video_url: string | null; status: string; created_at: string; full_name?: string; }
interface MessageRow { id: string; sender_id: string; receiver_id: string; content: string; flagged: boolean; flag_reason: string | null; created_at: string; sender_name?: string; receiver_name?: string; }
interface ScoutRequestRow { id: string; scout_id: string; player_id: string; status: string; notes: string | null; admin_response: string | null; created_at: string; scout_name?: string; player_name?: string; }
interface Stats { totalPlayers: number; totalScouts: number; activeScouts: number; pendingScouts: number; liveVideos: number; totalRevenue: number; flaggedMessages: number; pendingRequests: number; }

const AdminDashboard = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [scouts, setScouts] = useState<ScoutRow[]>([]);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [scoutRequests, setScoutRequests] = useState<ScoutRequestRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== "admin") { navigate("/"); return; }
    fetchAll();
  }, [user, role, authLoading]);

  const fetchAll = async () => {
    setLoading(true);
    const [scoutRes, videoRes, roleRes, paymentRes, msgRes, reqRes] = await Promise.all([
      supabase.from("scout_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("videos").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("role"),
      supabase.from("payments").select("amount, status"),
      supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("scout_requests").select("*").order("created_at", { ascending: false }),
    ]);

    const scoutData = scoutRes.data || [];
    const videoData = videoRes.data || [];
    const roles = roleRes.data || [];
    const payments = paymentRes.data || [];
    const msgData = msgRes.data || [];
    const reqData = (reqRes.data || []) as ScoutRequestRow[];

    const allUserIds = [...new Set([
      ...scoutData.map((s) => s.user_id),
      ...videoData.map((v) => v.user_id),
      ...msgData.flatMap((m) => [m.sender_id, m.receiver_id]),
      ...reqData.flatMap((r) => [r.scout_id, r.player_id]),
    ])];

    let profileMap = new Map<string, string>();
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", allUserIds);
      (profiles || []).forEach((p) => profileMap.set(p.user_id, p.full_name));
    }

    setScouts(scoutData.map((s) => ({ ...s, full_name: profileMap.get(s.user_id) || "Unknown" })));
    setVideos(videoData.map((v) => ({ ...v, full_name: profileMap.get(v.user_id) || "Unknown" })));
    setMessages(msgData.map((m) => ({ ...m, sender_name: profileMap.get(m.sender_id) || "Unknown", receiver_name: profileMap.get(m.receiver_id) || "Unknown" })));
    setScoutRequests(reqData.map((r) => ({ ...r, scout_name: profileMap.get(r.scout_id) || "Unknown", player_name: profileMap.get(r.player_id) || "Unknown" })));

    setStats({
      totalPlayers: roles.filter((r) => r.role === "player").length,
      totalScouts: roles.filter((r) => r.role === "scout").length,
      activeScouts: scoutData.filter((s) => s.verification_status === "active").length,
      pendingScouts: scoutData.filter((s) => s.verification_status === "pending").length,
      liveVideos: videoData.filter((v) => v.status === "live").length,
      totalRevenue: payments.filter((p) => p.status === "success").reduce((sum, p) => sum + Number(p.amount), 0),
      flaggedMessages: msgData.filter((m) => m.flagged).length,
      pendingRequests: reqData.filter((r) => r.status === "pending").length,
    });
    setLoading(false);
  };

  const updateScoutStatus = async (scoutId: string, status: "active" | "rejected") => {
    const { error } = await supabase.from("scout_profiles").update({ verification_status: status }).eq("id", scoutId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: `Scout ${status === "active" ? "approved" : "rejected"}` }); fetchAll(); }
  };

  const updateVideoStatus = async (videoId: string, status: "live" | "rejected") => {
    const { error } = await supabase.from("videos").update({ status }).eq("id", videoId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: `Video ${status === "live" ? "approved" : "rejected"}` }); fetchAll(); }
  };

  const toggleFlag = async (msgId: string, currentlyFlagged: boolean) => {
    const { error } = await supabase.from("messages").update({ flagged: !currentlyFlagged, flag_reason: !currentlyFlagged ? "Flagged by admin for review" : null }).eq("id", msgId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: !currentlyFlagged ? "Message flagged" : "Flag removed" }); fetchAll(); }
  };

  const handleScoutRequest = async (reqId: string, status: "approved" | "rejected", playerId: string, playerName: string, scoutName: string) => {
    const { error } = await supabase.from("scout_requests").update({ status, admin_response: status === "approved" ? "Player details forwarded" : "Request denied" } as any).eq("id", reqId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    // Send feedback notification to player
    const notifType = status === "approved" ? "selection" : "feedback";
    const notifTitle = status === "approved" ? "🎉 Congratulations! You've been selected!" : "📋 Scouting Feedback";
    const notifMessage = status === "approved"
      ? `A scout (${scoutName}) has shown interest in you! Your details have been shared. Keep up the great work!`
      : `A scout reviewed your profile but decided not to proceed at this time. Keep improving and uploading new highlights!`;

    await supabase.from("notifications").insert({ user_id: playerId, title: notifTitle, message: notifMessage, type: notifType } as any);

    toast({ title: `Request ${status}. Player notified.` });
    fetchAll();
  };

  const sendPersonalizedFeedback = async (playerId: string, playerName: string) => {
    const feedback = feedbackInputs[playerId];
    if (!feedback?.trim()) return;
    await supabase.from("notifications").insert({ user_id: playerId, title: "📝 Personalized Feedback from Admin", message: feedback, type: "feedback" } as any);
    toast({ title: `Feedback sent to ${playerName}` });
    setFeedbackInputs((prev) => ({ ...prev, [playerId]: "" }));
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="font-display text-4xl text-foreground">ADMIN PANEL</h1>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: "Players", value: stats.totalPlayers, icon: Users },
                { label: "Scouts", value: `${stats.activeScouts}/${stats.totalScouts}`, icon: Shield },
                { label: "Live Videos", value: stats.liveVideos, icon: Video },
                { label: "Revenue", value: `৳${stats.totalRevenue}`, icon: DollarSign },
                { label: "Flagged", value: stats.flaggedMessages, icon: AlertTriangle },
                { label: "Requests", value: stats.pendingRequests, icon: UserPlus },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</span>
                  </div>
                  <p className="font-display text-3xl text-foreground">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <Tabs defaultValue="scouts" className="space-y-6">
            <TabsList className="bg-card border border-border flex-wrap">
              <TabsTrigger value="scouts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Scouts ({stats?.pendingScouts || 0})</TabsTrigger>
              <TabsTrigger value="videos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Videos</TabsTrigger>
              <TabsTrigger value="requests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Requests ({stats?.pendingRequests || 0})</TabsTrigger>
              <TabsTrigger value="safety" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Safety ({stats?.flaggedMessages || 0})</TabsTrigger>
              <TabsTrigger value="notices" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Notices</TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Profile</TabsTrigger>
            </TabsList>

            {/* Scouts Tab */}
            <TabsContent value="scouts" className="space-y-3">
              {scouts.length === 0 ? <p className="text-muted-foreground text-center py-12">No scout registrations yet.</p> : scouts.map((s) => (
                <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.organization || "No organization"} • {new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={s.verification_status === "active" ? "bg-primary/20 text-primary border-primary/30" : s.verification_status === "pending" ? "bg-accent/20 text-accent-foreground border-accent/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                      {s.verification_status === "active" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {s.verification_status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                      {s.verification_status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                      {s.verification_status}
                    </Badge>
                    {s.verification_status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => updateScoutStatus(s.id, "active")} className="bg-primary text-primary-foreground hover:bg-primary/90">Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => updateScoutStatus(s.id, "rejected")} className="border-destructive/40 text-destructive hover:bg-destructive/10">Reject</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="space-y-3">
              {videos.length === 0 ? <p className="text-muted-foreground text-center py-12">No videos submitted yet.</p> : videos.map((v) => (
                <div key={v.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{v.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{v.description || "No description"} • {new Date(v.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={v.status === "live" ? "bg-primary/20 text-primary border-primary/30" : v.status === "rejected" ? "bg-destructive/20 text-destructive border-destructive/30" : "bg-muted text-muted-foreground border-border"}>{v.status}</Badge>
                    {v.video_url && <Button size="sm" variant="ghost" onClick={() => navigate(`/resume/${v.user_id}`)}><Eye className="h-4 w-4" /></Button>}
                    {(v.status === "pending_payment" || v.status === "draft") && (
                      <>
                        <Button size="sm" onClick={() => updateVideoStatus(v.id, "live")} className="bg-primary text-primary-foreground hover:bg-primary/90">Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => updateVideoStatus(v.id, "rejected")} className="border-destructive/40 text-destructive hover:bg-destructive/10">Reject</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Scout Requests Tab */}
            <TabsContent value="requests" className="space-y-3">
              {scoutRequests.length === 0 ? <p className="text-muted-foreground text-center py-12">No scout requests yet.</p> : scoutRequests.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">Scout: <span className="text-primary">{r.scout_name}</span> → Player: <span className="text-primary">{r.player_name}</span></p>
                      <p className="text-xs text-muted-foreground">{r.notes || "No notes"} • {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={r.status === "approved" ? "bg-primary/20 text-primary border-primary/30" : r.status === "rejected" ? "bg-destructive/20 text-destructive border-destructive/30" : "bg-muted text-muted-foreground border-border"}>{r.status}</Badge>
                      {r.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => handleScoutRequest(r.id, "approved", r.player_id, r.player_name || "", r.scout_name || "")} className="bg-primary text-primary-foreground hover:bg-primary/90">Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => handleScoutRequest(r.id, "rejected", r.player_id, r.player_name || "", r.scout_name || "")} className="border-destructive/40 text-destructive hover:bg-destructive/10">Reject</Button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Personalized feedback */}
                  <div className="flex gap-2">
                    <Input placeholder={`Send feedback to ${r.player_name}...`} className="bg-secondary border-border text-sm" value={feedbackInputs[r.player_id] || ""} onChange={(e) => setFeedbackInputs((prev) => ({ ...prev, [r.player_id]: e.target.value }))} />
                    <Button size="sm" variant="outline" onClick={() => sendPersonalizedFeedback(r.player_id, r.player_name || "")} className="border-primary/40 text-primary shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Safety Log */}
            <TabsContent value="safety" className="space-y-3">
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-accent" />
                  <p className="text-sm text-muted-foreground">All scout-player messages are logged here for safety monitoring.</p>
                </div>
              </div>
              {messages.length === 0 ? <p className="text-muted-foreground text-center py-12">No messages recorded yet.</p> : messages.map((m) => (
                <div key={m.id} className={`bg-card border rounded-xl p-4 flex items-start justify-between gap-4 ${m.flagged ? "border-accent/50 bg-accent/5" : "border-border"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">{m.sender_name}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-sm font-semibold text-foreground">{m.receiver_name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{m.content}</p>
                    {m.flagged && m.flag_reason && (
                      <div className="flex items-center gap-1 mt-2"><AlertTriangle className="h-3 w-3 text-accent" /><span className="text-xs text-accent">{m.flag_reason}</span></div>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toggleFlag(m.id, m.flagged)}
                    className={m.flagged ? "border-primary/40 text-primary hover:bg-primary/10" : "border-accent/40 text-accent hover:bg-accent/10"}>
                    {m.flagged ? "Unflag" : "Flag"}
                  </Button>
                </div>
              ))}
            </TabsContent>

            {/* Notices Tab */}
            <TabsContent value="notices">
              <AdminNoticeForm />
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
