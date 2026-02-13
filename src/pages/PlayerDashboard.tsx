import { motion } from "framer-motion";
import { Upload, Tag, CreditCard, Award, Video, Loader2, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const footballTags = ["Striker", "Defender", "Goalkeeper", "Midfielder", "Winger"];
const cricketTags = ["Bowler (Fast)", "Bowler (Spin)", "Batsman", "Wicketkeeper", "All-rounder"];
const traitTags = ["Tactical", "Pace Abuser", "Freestyler", "Classical", "Aggressive"];

const PlayerDashboard = () => {
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [bkashNumber, setBkashNumber] = useState("");
  const [uploading, setUploading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [sport, setSport] = useState<string>("football");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      // Fetch profile sport and existing video
      supabase.from("profiles").select("sport").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data?.sport) setSport(data.sport);
      });
      supabase.from("videos").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).then(({ data }) => {
        if (data && data.length > 0) {
          const v = data[0];
          setVideoId(v.id);
          setVideoStatus(v.status);
          setDescription(v.description || "");
          setSelectedPositions(v.position_tags || []);
          setSelectedTraits(v.trait_tags || []);
          if (v.status === "live") setPaymentDone(true);
        }
      });
    }
  }, [user, authLoading]);

  const positionTags = sport === "cricket" ? cricketTags : footballTags;

  const toggleTag = (tag: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  const handleUpload = async () => {
    if (!videoFile || !user) return;
    setUploading(true);
    try {
      const ext = videoFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("player-videos").upload(filePath, videoFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("player-videos").getPublicUrl(filePath);

      const { data: video, error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        description,
        video_url: publicUrl,
        status: "pending_payment" as any,
        position_tags: selectedPositions,
        trait_tags: selectedTraits,
      }).select().single();

      if (dbError) throw dbError;
      setVideoId(video.id);
      setVideoStatus("pending_payment");
      toast({ title: "Video uploaded!", description: "Now complete payment to go live." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handlePayment = async () => {
    if (!videoId || !user) return;
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: { video_id: videoId, bkash_number: bkashNumber },
      });
      if (error) throw error;
      setPaymentDone(true);
      setVideoStatus("live");
      setTransactionId(data.transaction_id);
      toast({ title: "Payment successful! ✅", description: `Transaction: ${data.transaction_id}` });
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  const downloadCertificate = () => {
    // Generate a simple certificate as downloadable HTML (in production, use PDF library)
    const cert = `
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f0fdf4;">
        <h1 style="color:#16a34a;">🏆 Digital Participation Certificate</h1>
        <hr/>
        <p style="font-size:18px;">This certifies that</p>
        <h2>${user?.user_metadata?.full_name || "Player"}</h2>
        <p>has successfully registered and submitted a highlight video on <strong>TalentBridge BD</strong>.</p>
        <p>Transaction ID: <strong>${transactionId}</strong></p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <br/><p style="color:#666;font-size:12px;">TalentBridge BD — Digitizing Bangladesh Sports</p>
      </body></html>
    `;
    const blob = new Blob([cert], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TalentBridge_Certificate.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-4xl text-foreground">UPLOAD HUB</h1>
            <Button variant="outline" size="sm" onClick={() => navigate(`/resume/${user?.id}`)} className="border-primary/40 text-primary">
              View Resume
            </Button>
          </div>
          <p className="text-muted-foreground mb-8">Showcase your skills to verified scouts across Bangladesh</p>

          <div className="space-y-8">
            {/* Video Upload */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Video className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl text-foreground">HIGHLIGHT VIDEO</h2>
                {videoStatus && (
                  <Badge variant={videoStatus === "live" ? "default" : "outline"} className={videoStatus === "live" ? "bg-primary text-primary-foreground" : ""}>
                    {videoStatus}
                  </Badge>
                )}
              </div>

              {!videoId ? (
                <>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer bg-secondary/50"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-foreground font-medium mb-1">
                      {videoFile ? videoFile.name : "Drop your video here"}
                    </p>
                    <p className="text-xs text-muted-foreground">Max 3 minutes • MP4, MOV, AVI</p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                </>
              ) : (
                <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-4">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-foreground text-sm">Video uploaded successfully</span>
                </div>
              )}

              <div className="mt-4">
                <Label className="text-sm text-muted-foreground">Video Description (max 100 words)</Label>
                <Textarea
                  placeholder="Tell scouts what makes you special..."
                  className="mt-1 bg-secondary border-border resize-none"
                  rows={3}
                  maxLength={600}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Tag className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl text-foreground">POSITION & TRAITS</h2>
              </div>
              <div className="mb-4">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Position</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {positionTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedPositions.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        selectedPositions.includes(tag)
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                      onClick={() => toggleTag(tag, selectedPositions, setSelectedPositions)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Play Style</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {traitTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTraits.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        selectedTraits.includes(tag)
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                      onClick={() => toggleTag(tag, selectedTraits, setSelectedTraits)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Upload Button */}
            {!videoId && videoFile && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 glow"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload Video
              </Button>
            )}

            {/* Payment */}
            {videoId && !paymentDone && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl text-foreground">PAYMENT</h2>
                </div>
                <div className="flex items-center justify-between bg-secondary rounded-lg p-4 mb-4">
                  <div>
                    <p className="text-foreground font-medium">Participation Fee</p>
                    <p className="text-xs text-muted-foreground">One-time payment via bKash</p>
                  </div>
                  <span className="font-display text-3xl text-primary">৳100</span>
                </div>
                <div className="mb-4">
                  <Label className="text-sm text-muted-foreground">bKash Number</Label>
                  <Input
                    placeholder="01XXXXXXXXX"
                    className="mt-1 bg-secondary border-border"
                    value={bkashNumber}
                    onChange={(e) => setBkashNumber(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 glow"
                  onClick={handlePayment}
                  disabled={paying || !bkashNumber}
                >
                  {paying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Pay with bKash & Go Live
                </Button>
              </div>
            )}

            {/* Certificate */}
            {paymentDone && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl text-foreground">DIGITAL CERTIFICATE</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Your video is now live! Download your Digital Participation Certificate below.
                </p>
                <Button onClick={downloadCertificate} variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
                  <Download className="h-4 w-4 mr-2" /> Download Certificate
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
