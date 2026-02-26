import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Video, DollarSign, CheckCircle, XCircle, Clock, Loader2, Eye, AlertTriangle, MessageSquare, UserPlus, Send, User, Search, Filter } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";
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
  // Search & filter states
  const [scoutSearch, setScoutSearch] = useState("");
  const [scoutFilter, setScoutFilter] = useState<string>("all");
  const [videoSearch, setVideoSearch] = useState("");
  const [videoFilter, setVideoFilter] = useState<string>("all");
  const [requestSearch, setRequestSearch] = useState("");
  const [requestFilter, setRequestFilter] = useState<string>("all");
  const [messageSearch, setMessageSearch] = useState("");
  const [messageFilter, setMessageFilter] = useState<string>("all");
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

  const handleScoutRequest = async (reqId: string, status: "approved" | "rejected", playerId: string, playerName: string, scoutName: string, scoutId: string) => {
    const { error } = await supabase.from("scout_requests").update({ status, admin_response: status === "approved" ? "Player details forwarded" : "Request denied" } as any).eq("id", reqId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    if (status === "approved") {
      // Get full player details to forward to scout
      const { data: playerProfile } = await supabase.from("profiles").select("*").eq("user_id", playerId).maybeSingle();
      const playerDetails = playerProfile
        ? `Name: ${playerProfile.full_name}\nPhone: ${playerProfile.phone || "N/A"}\nSport: ${playerProfile.sport || "N/A"}\nGender: ${playerProfile.gender || "N/A"}\nDOB: ${playerProfile.date_of_birth || "N/A"}\nGuardian: ${playerProfile.guardian_contact || "N/A"}\nBio: ${playerProfile.bio || "N/A"}`
        : "Player details unavailable";

      // Notify SCOUT with full player details (scout-only, not visible to players)
      await supabase.from("notifications").insert({
        user_id: scoutId,
        title: `✅ Player Details: ${playerName}`,
        message: playerDetails,
        type: "selection",
        metadata: {
          player_id: playerId,
          player_name: playerName,
          phone: playerProfile?.phone,
          sport: playerProfile?.sport,
          gender: playerProfile?.gender,
          dob: playerProfile?.date_of_birth,
          guardian: playerProfile?.guardian_contact,
          bio: playerProfile?.bio,
          avatar_url: playerProfile?.avatar_url,
        },
      } as any);

      // Notify PLAYER (congratulations only — no private details exposed)
      await supabase.from("notifications").insert({
        user_id: playerId,
        title: "🎉 Congratulations! You've been selected!",
        message: `A scout (${scoutName}) has shown interest in you! Your details have been shared. Keep up the great work!`,
        type: "selection",
      } as any);
    } else {
      // Rejected: only notify player — scouts see status change in their dashboard
      await supabase.from("notifications").insert({
        user_id: playerId,
        title: "📋 Scouting Update",
        message: `A scout reviewed your profile but decided not to proceed at this time. Keep improving and uploading new highlights!`,
        type: "feedback",
      } as any);
    }

    toast({ title: `Request ${status}.`, description: status === "approved" ? "Player details forwarded to scout. Player notified." : "Player notified." });
    fetchAll();
  };

  const sendPersonalizedFeedback = async (reqId: string, scoutId: string, scoutName: string, playerId: string, playerName: string) => {
    const feedback = feedbackInputs[reqId];
    if (!feedback?.trim()) return;

    // Send feedback to PLAYER
    await supabase.from("notifications").insert({
      user_id: playerId,
      title: "📝 Personalized Feedback from Admin",
      message: feedback,
      type: "feedback",
    } as any);

    // Also send feedback context to SCOUT so they know admin responded
    await supabase.from("notifications").insert({
      user_id: scoutId,
      title: `📋 Admin Note on ${playerName}`,
      message: `Admin feedback regarding your request for ${playerName}: "${feedback}"`,
      type: "feedback",
    } as any);

    toast({ title: `Feedback sent to ${playerName} and noted to ${scoutName}` });
    setFeedbackInputs((prev) => ({ ...prev, [reqId]: "" }));
  };

  // Filtered data
  const filteredScouts = scouts.filter((s) => {
    const matchSearch = !scoutSearch || s.full_name?.toLowerCase().includes(scoutSearch.toLowerCase()) || s.organization?.toLowerCase().includes(scoutSearch.toLowerCase());
    const matchFilter = scoutFilter === "all" || s.verification_status === scoutFilter;
    return matchSearch && matchFilter;
  });

  const filteredVideos = videos.filter((v) => {
    const matchSearch = !videoSearch || v.full_name?.toLowerCase().includes(videoSearch.toLowerCase()) || v.description?.toLowerCase().includes(videoSearch.toLowerCase());
    const matchFilter = videoFilter === "all" || v.status === videoFilter;
    return matchSearch && matchFilter;
  });

  const filteredRequests = scoutRequests.filter((r) => {
    const matchSearch = !requestSearch || r.scout_name?.toLowerCase().includes(requestSearch.toLowerCase()) || r.player_name?.toLowerCase().includes(requestSearch.toLowerCase());
    const matchFilter = requestFilter === "all" || r.status === requestFilter;
    return matchSearch && matchFilter;
  });

  const filteredMessages = messages.filter((m) => {
    const matchSearch = !messageSearch || m.sender_name?.toLowerCase().includes(messageSearch.toLowerCase()) || m.receiver_name?.toLowerCase().includes(messageSearch.toLowerCase()) || m.content.toLowerCase().includes(messageSearch.toLowerCase());
    const matchFilter = messageFilter === "all" || (messageFilter === "flagged" && m.flagged) || (messageFilter === "clean" && !m.flagged);
    return matchSearch && matchFilter;
  });

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const SearchFilterBar = ({ search, setSearch, filter, setFilter, filters, placeholder }: { search: string; setSearch: (v: string) => void; filter: string; setFilter: (v: string) => void; filters: { value: string; label: string }[]; placeholder: string }) => (
    <div className="flex flex-col sm:flex-row gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={placeholder} className="pl-10 bg-secondary border-border rounded-xl text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {filters.map((f) => (
          <Button key={f.value} size="sm" variant="outline"
            onClick={() => setFilter(filter === f.value ? "all" : f.value)}
            className={`text-xs rounded-full border-border ${filter === f.value ? "border-primary text-primary bg-primary/10" : "text-muted-foreground"}`}>
            <Filter className="h-3 w-3 mr-1" /> {f.label}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="font-display text-4xl text-foreground">ADMIN PANEL</h1>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
              {[
                { label: "Players", value: stats.totalPlayers, icon: Users },
                { label: "Scouts", value: `${stats.activeScouts}/${stats.totalScouts}`, icon: Shield },
                { label: "Live Videos", value: stats.liveVideos, icon: Video },
                { label: "Revenue", value: `৳${stats.totalRevenue}`, icon: DollarSign },
                { label: "Flagged", value: stats.flaggedMessages, icon: AlertTriangle },
                { label: "Requests", value: stats.pendingRequests, icon: UserPlus },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className="h-4 w-4 text-primary" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
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
              <SearchFilterBar search={scoutSearch} setSearch={setScoutSearch} filter={scoutFilter} setFilter={setScoutFilter} placeholder="Search scouts..."
                filters={[{ value: "pending", label: "Pending" }, { value: "active", label: "Active" }, { value: "rejected", label: "Rejected" }]} />
              {filteredScouts.length === 0 ? <p className="text-muted-foreground text-center py-12">No scouts found.</p> : filteredScouts.map((s) => (
                <div key={s.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.organization || "No organization"} • {new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`rounded-full ${s.verification_status === "active" ? "bg-primary/20 text-primary border-primary/30" : s.verification_status === "pending" ? "bg-accent/20 text-accent-foreground border-accent/30" : "bg-destructive/20 text-destructive border-destructive/30"}`}>
                      {s.verification_status === "active" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {s.verification_status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                      {s.verification_status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                      {s.verification_status}
                    </Badge>
                    {s.verification_status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => updateScoutStatus(s.id, "active")} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs">Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => updateScoutStatus(s.id, "rejected")} className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-full text-xs">Reject</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="space-y-3">
              <SearchFilterBar search={videoSearch} setSearch={setVideoSearch} filter={videoFilter} setFilter={setVideoFilter} placeholder="Search videos..."
                filters={[{ value: "pending_payment", label: "Pending" }, { value: "live", label: "Live" }, { value: "rejected", label: "Rejected" }, { value: "draft", label: "Draft" }]} />
              {filteredVideos.length === 0 ? <p className="text-muted-foreground text-center py-12">No videos found.</p> : filteredVideos.map((v) => (
                <div key={v.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{v.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{v.description || "No description"} • {new Date(v.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`rounded-full ${v.status === "live" ? "bg-primary/20 text-primary border-primary/30" : v.status === "rejected" ? "bg-destructive/20 text-destructive border-destructive/30" : "bg-muted text-muted-foreground border-border"}`}>{v.status}</Badge>
                    {v.video_url && <Button size="sm" variant="ghost" onClick={() => navigate(`/resume/${v.user_id}`)}><Eye className="h-4 w-4" /></Button>}
                    {(v.status === "pending_payment" || v.status === "draft") && (
                      <>
                        <Button size="sm" onClick={() => updateVideoStatus(v.id, "live")} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs">Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => updateVideoStatus(v.id, "rejected")} className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-full text-xs">Reject</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Scout Requests Tab */}
            <TabsContent value="requests" className="space-y-3">
              <SearchFilterBar search={requestSearch} setSearch={setRequestSearch} filter={requestFilter} setFilter={setRequestFilter} placeholder="Search requests..."
                filters={[{ value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }]} />
              {filteredRequests.length === 0 ? <p className="text-muted-foreground text-center py-12">No requests found.</p> : filteredRequests.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">Scout: <span className="text-primary">{r.scout_name}</span> → Player: <span className="text-primary">{r.player_name}</span></p>
                      <p className="text-xs text-muted-foreground">{r.notes || "No notes"} • {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`rounded-full ${r.status === "approved" ? "bg-primary/20 text-primary border-primary/30" : r.status === "rejected" ? "bg-destructive/20 text-destructive border-destructive/30" : "bg-muted text-muted-foreground border-border"}`}>{r.status}</Badge>
                      {r.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => handleScoutRequest(r.id, "approved", r.player_id, r.player_name || "", r.scout_name || "", r.scout_id)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs">Approve & Forward</Button>
                          <Button size="sm" variant="outline" onClick={() => handleScoutRequest(r.id, "rejected", r.player_id, r.player_name || "", r.scout_name || "", r.scout_id)} className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-full text-xs">Reject</Button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Personalized feedback — sent to player, also noted to scout */}
                  <div className="flex gap-2">
                    <Input placeholder={`Send feedback to ${r.player_name}...`} className="bg-secondary border-border text-sm rounded-xl" value={feedbackInputs[r.id] || ""} onChange={(e) => setFeedbackInputs((prev) => ({ ...prev, [r.id]: e.target.value }))} />
                    <Button size="sm" variant="outline" onClick={() => sendPersonalizedFeedback(r.id, r.scout_id, r.scout_name || "", r.player_id, r.player_name || "")} className="border-primary/40 text-primary shrink-0 rounded-full">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Safety Log */}
            <TabsContent value="safety" className="space-y-4">
              <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-accent" />
                  <p className="text-sm text-muted-foreground">All scout-player messages are logged here for safety monitoring. Use the chat view below to inspect and flag conversations.</p>
                </div>
              </div>
              <ChatInterface adminView={true} />
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
