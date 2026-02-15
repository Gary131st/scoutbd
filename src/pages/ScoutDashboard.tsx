import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Play, ShieldCheck, ShieldAlert, Loader2, User, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ProfileTab from "@/components/ProfileTab";
import ScoutSelectPlayer from "@/components/ScoutSelectPlayer";

interface PlayerCard {
  id: string;
  user_id: string;
  full_name: string;
  sport: string;
  video_url: string | null;
  position_tags: string[];
  trait_tags: string[];
}

interface ScoutRequest {
  id: string;
  player_id: string;
  status: string;
  notes: string | null;
  admin_response: string | null;
  created_at: string;
  player_name?: string;
}

const ScoutDashboard = () => {
  const { user, role, scoutStatus, loading: authLoading } = useAuth();
  const [players, setPlayers] = useState<PlayerCard[]>([]);
  const [requests, setRequests] = useState<ScoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth?role=scout"); return; }

    const fetchData = async () => {
      const [videosRes, requestsRes] = await Promise.all([
        supabase.from("videos").select("id, user_id, video_url, position_tags, trait_tags").eq("status", "live" as any),
        supabase.from("scout_requests").select("*").eq("scout_id", user.id).order("created_at", { ascending: false }),
      ]);

      const videos = videosRes.data || [];
      const reqs = (requestsRes.data || []) as ScoutRequest[];

      const userIds = [...new Set([...videos.map((v) => v.user_id), ...reqs.map((r) => r.player_id)])];
      let profileMap = new Map<string, { full_name: string; sport: string }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, sport").in("user_id", userIds);
        (profiles || []).forEach((p) => profileMap.set(p.user_id, { full_name: p.full_name, sport: p.sport || "football" }));
      }

      setPlayers(videos.map((v) => ({
        id: v.id, user_id: v.user_id, video_url: v.video_url,
        position_tags: v.position_tags || [], trait_tags: v.trait_tags || [],
        full_name: profileMap.get(v.user_id)?.full_name || "Unknown",
        sport: profileMap.get(v.user_id)?.sport || "football",
      })));

      setRequests(reqs.map((r) => ({ ...r, player_name: profileMap.get(r.player_id)?.full_name || "Unknown" })));
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading]);

  const filtered = players.filter((p) => {
    const matchSearch = !search || p.full_name.toLowerCase().includes(search.toLowerCase()) || p.position_tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchSport = !sportFilter || p.sport === sportFilter;
    return matchSearch && matchSport;
  });

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-4xl text-foreground">SCOUT DASHBOARD</h1>
            {scoutStatus && (
              <Badge className={`text-sm ${scoutStatus === "active" ? "bg-primary/20 text-primary border-primary/30" : scoutStatus === "pending" ? "bg-accent/20 text-accent border-accent/30" : "bg-destructive/20 text-destructive border-destructive/30"}`}>
                {scoutStatus === "active" ? <ShieldCheck className="h-3 w-3 mr-1" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                {scoutStatus.toUpperCase()}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mb-6">Browse and select players from across Bangladesh</p>

          {scoutStatus === "pending" && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 mb-8 text-center">
              <ShieldAlert className="h-8 w-8 text-accent mx-auto mb-2" />
              <h3 className="font-display text-xl text-foreground mb-1">VERIFICATION PENDING</h3>
              <p className="text-sm text-muted-foreground">Your scout account is under review.</p>
            </div>
          )}

          <Tabs defaultValue="talent" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="talent" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Search className="h-4 w-4 mr-1.5" /> Talent Database
              </TabsTrigger>
              <TabsTrigger value="requests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ClipboardList className="h-4 w-4 mr-1.5" /> My Requests ({requests.length})
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <User className="h-4 w-4 mr-1.5" /> My Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="talent">
              {(scoutStatus === "active" || !scoutStatus) && (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search by name or position..." className="pl-10 bg-card border-border" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSportFilter(sportFilter === "football" ? null : "football")}
                        className={`border-border text-muted-foreground hover:border-primary/40 ${sportFilter === "football" ? "border-primary text-primary" : ""}`}>
                        <Filter className="h-4 w-4 mr-1" /> Football
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSportFilter(sportFilter === "cricket" ? null : "cricket")}
                        className={`border-border text-muted-foreground hover:border-primary/40 ${sportFilter === "cricket" ? "border-primary text-primary" : ""}`}>
                        <Filter className="h-4 w-4 mr-1" /> Cricket
                      </Button>
                    </div>
                  </div>

                  {filtered.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground"><p>No players found yet.</p></div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filtered.map((player, i) => (
                        <motion.div key={player.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                          className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/40 transition-all">
                          <div className="relative aspect-video bg-secondary flex items-center justify-center cursor-pointer" onClick={() => navigate(`/resume/${player.user_id}`)}>
                            {player.video_url ? (
                              <video src={player.video_url} className="w-full h-full object-cover" muted />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                <Play className="h-5 w-5 text-primary ml-0.5" />
                              </div>
                            )}
                            <Badge className="absolute top-2 left-2 bg-primary/20 text-primary border-0 text-xs">{player.sport}</Badge>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-foreground cursor-pointer hover:text-primary" onClick={() => navigate(`/resume/${player.user_id}`)}>{player.full_name}</h3>
                              <ScoutSelectPlayer playerId={player.user_id} playerName={player.full_name} />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {player.position_tags.map((t) => <Badge key={t} variant="outline" className="text-xs border-primary/30 text-primary">{t}</Badge>)}
                              {player.trait_tags.map((t) => <Badge key={t} variant="outline" className="text-xs border-border text-muted-foreground">{t}</Badge>)}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-3">
              {requests.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No player requests yet. Browse the talent database and select players.</p>
              ) : (
                requests.map((r) => (
                  <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{r.player_name}</p>
                      <p className="text-xs text-muted-foreground">{r.notes || "No notes"} • {new Date(r.created_at).toLocaleDateString()}</p>
                      {r.admin_response && <p className="text-xs text-primary mt-1">Admin: {r.admin_response}</p>}
                    </div>
                    <Badge className={r.status === "approved" ? "bg-primary/20 text-primary border-primary/30" : r.status === "rejected" ? "bg-destructive/20 text-destructive border-destructive/30" : "bg-muted text-muted-foreground border-border"}>
                      {r.status}
                    </Badge>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default ScoutDashboard;
