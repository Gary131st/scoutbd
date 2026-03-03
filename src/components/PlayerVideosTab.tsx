import { useState, useEffect } from "react";
import { Play, Loader2, Eye, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface PlayerVideo {
  id: string;
  user_id: string;
  video_url: string | null;
  description: string | null;
  position_tags: string[];
  trait_tags: string[];
  full_name: string;
  sport: string;
  avatar_url: string;
}

const PlayerVideosTab = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<PlayerVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<PlayerVideo | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data: vids } = await supabase
        .from("videos")
        .select("id, user_id, video_url, description, position_tags, trait_tags")
        .eq("status", "live" as any);

      if (!vids || vids.length === 0) { setVideos([]); setLoading(false); return; }

      // Exclude own videos only for players
      const filtered = role === "player" ? vids.filter((v) => v.user_id !== user?.id) : vids;
      const userIds = [...new Set(filtered.map((v) => v.user_id))];

      // Always fetch fresh profile data so name/avatar changes propagate immediately
      let profileMap = new Map<string, { full_name: string; sport: string; avatar_url: string }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, sport, avatar_url")
          .in("user_id", userIds);
        (profiles || []).forEach((p) =>
          profileMap.set(p.user_id, {
            full_name: p.full_name,
            sport: p.sport || "football",
            avatar_url: p.avatar_url || "",
          })
        );
      }

      setVideos(
        filtered
          .filter((v) => profileMap.has(v.user_id))
          .map((v) => ({
            ...v,
            position_tags: v.position_tags || [],
            trait_tags: v.trait_tags || [],
            full_name: profileMap.get(v.user_id)?.full_name || "Unknown",
            sport: profileMap.get(v.user_id)?.sport || "football",
            avatar_url: profileMap.get(v.user_id)?.avatar_url || "",
          }))
          .filter((v) => v.full_name && v.full_name !== "Unknown")
      );
      setLoading(false);
    };
    fetchVideos();
  }, [user, role]);

  const filteredVideos = videos.filter((v) =>
    !search ||
    v.full_name.toLowerCase().includes(search.toLowerCase()) ||
    v.position_tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search players, positions..."
          className="pl-10 bg-card border-border rounded-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredVideos.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No player videos available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
          {filteredVideos.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="relative aspect-square bg-secondary overflow-hidden cursor-pointer group"
              onClick={() => setSelectedVideo(v)}
            >
              {v.video_url ? (
                <video src={v.video_url} className="w-full h-full object-cover" muted />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <div className="flex items-center gap-1 text-foreground font-semibold text-sm">
                  <Eye className="h-4 w-4" /> View
                </div>
              </div>
              <Badge className="absolute top-2 left-2 bg-background/70 text-foreground border-0 text-[10px] backdrop-blur-sm">
                {v.sport}
              </Badge>
            </motion.div>
          ))}
        </div>
      )}

      {/* Video detail modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden border border-border">
                  {selectedVideo.avatar_url ? (
                    <img src={selectedVideo.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                      {selectedVideo.full_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedVideo.full_name}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedVideo.sport}</p>
                </div>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="ml-auto text-muted-foreground hover:text-foreground text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="aspect-video bg-secondary">
                {selectedVideo.video_url ? (
                  <video src={selectedVideo.video_url} className="w-full h-full object-cover" controls autoPlay muted />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3 overflow-y-auto">
                <button
                  onClick={() => navigate(`/resume/${selectedVideo.user_id}`)}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  View Full Profile →
                </button>

                {selectedVideo.description && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground mr-1">{selectedVideo.full_name}</span>
                    {selectedVideo.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {selectedVideo.position_tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs border-primary/30 text-primary rounded-full">{t}</Badge>
                  ))}
                  {selectedVideo.trait_tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs border-border text-muted-foreground rounded-full">{t}</Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayerVideosTab;
