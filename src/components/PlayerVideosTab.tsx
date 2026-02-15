import { useState, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface PlayerVideo {
  id: string;
  user_id: string;
  video_url: string | null;
  description: string | null;
  position_tags: string[];
  trait_tags: string[];
  full_name: string;
  sport: string;
}

const PlayerVideosTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<PlayerVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data: vids } = await supabase
        .from("videos")
        .select("id, user_id, video_url, description, position_tags, trait_tags")
        .eq("status", "live" as any);

      if (!vids || vids.length === 0) { setVideos([]); setLoading(false); return; }

      // Exclude own videos
      const otherVids = vids.filter((v) => v.user_id !== user?.id);
      const userIds = [...new Set(otherVids.map((v) => v.user_id))];

      let profileMap = new Map<string, { full_name: string; sport: string }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, sport").in("user_id", userIds);
        (profiles || []).forEach((p) => profileMap.set(p.user_id, { full_name: p.full_name, sport: p.sport || "football" }));
      }

      setVideos(otherVids.map((v) => ({
        ...v,
        position_tags: v.position_tags || [],
        trait_tags: v.trait_tags || [],
        full_name: profileMap.get(v.user_id)?.full_name || "Unknown",
        sport: profileMap.get(v.user_id)?.sport || "football",
      })));
      setLoading(false);
    };
    fetchVideos();
  }, [user]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (videos.length === 0) return <p className="text-center text-muted-foreground py-12">No other player videos available yet.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((v, i) => (
        <motion.div
          key={v.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => navigate(`/resume/${v.user_id}`)}
          className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/40 transition-all cursor-pointer"
        >
          <div className="relative aspect-video bg-secondary flex items-center justify-center">
            {v.video_url ? (
              <video src={v.video_url} className="w-full h-full object-cover" muted />
            ) : (
              <Play className="h-8 w-8 text-muted-foreground" />
            )}
            <Badge className="absolute top-2 left-2 bg-primary/20 text-primary border-0 text-xs">{v.sport}</Badge>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-foreground mb-2">{v.full_name}</h3>
            <div className="flex flex-wrap gap-1.5">
              {v.position_tags.map((t) => <Badge key={t} variant="outline" className="text-xs border-primary/30 text-primary">{t}</Badge>)}
              {v.trait_tags.slice(0, 2).map((t) => <Badge key={t} variant="outline" className="text-xs border-border text-muted-foreground">{t}</Badge>)}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PlayerVideosTab;
