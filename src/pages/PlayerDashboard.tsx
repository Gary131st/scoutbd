import { motion } from "framer-motion";
import { Upload, Tag, CreditCard, Award, Video, Loader2, Download, CheckCircle, FileText, User, Eye, Flag } from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ProfileTab from "@/components/ProfileTab";
import PlayerVideosTab from "@/components/PlayerVideosTab";

const footballTags = ["Striker", "Defender", "Goalkeeper", "Midfielder", "Winger"];
const cricketTags = ["Bowler (Fast)", "Bowler (Spin)", "Batsman", "Wicketkeeper", "All-rounder"];
const traitTags = ["Tactical", "Pace Abuser", "Freestyler", "Classical", "Aggressive"];

interface Scout {
  user_id: string;
  full_name: string;
  organization: string | null;
}

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
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [sport, setSport] = useState<string>("football");
  const [reportOpen, setReportOpen] = useState(false);
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [selectedScoutId, setSelectedScoutId] = useState<string>("");
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) {
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
      // Fetch active scouts for report dialog
      supabase.from("scout_profiles")
        .select("user_id, organization")
        .eq("verification_status", "active")
        .then(async ({ data: scoutProfiles }) => {
          if (!scoutProfiles || scoutProfiles.length === 0) return;
          const ids = scoutProfiles.map((s) => s.user_id);
          const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
          const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
          setScouts(scoutProfiles.map((s) => ({
            user_id: s.user_id,
            full_name: profileMap.get(s.user_id) || "Unknown Scout",
            organization: s.organization,
          })));
        });
    }
  }, [user, authLoading]);

  const positionTags = sport === "cricket" ? cricketTags : footballTags;
  const toggleTag = (tag: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  // Upload only the DB record — actual file upload happens AFTER payment
  const handleUpload = async () => {
    if (!videoFile || !user) return;
    setUploading(true);
    try {
      // Create DB record with pending_payment status but DO NOT upload file yet
      const { data: video, error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        description,
        video_url: null, // will be filled after payment
        status: "pending_payment" as any,
        position_tags: selectedPositions,
        trait_tags: selectedTraits,
      }).select().single();
      if (dbError) throw dbError;
      setVideoId(video.id);
      setVideoStatus("pending_payment");
      toast({ title: "Details saved!", description: "Complete payment to upload your video and go live." });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const handlePayment = async () => {
    if (!videoId || !user || !videoFile) return;
    setPaying(true);
    try {
      // 1. Process payment first
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: { video_id: videoId, bkash_number: bkashNumber },
      });
      if (error) throw error;

      // 2. Only AFTER successful payment — upload the actual video file
      const ext = videoFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("player-videos").upload(filePath, videoFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("player-videos").getPublicUrl(filePath);

      // 3. Update video record with URL and live status
      await supabase.from("videos").update({ video_url: publicUrl, status: "live" as any }).eq("id", videoId);

      setPaymentDone(true);
      setVideoStatus("live");
      setTransactionId(data.transaction_id);
      setPaymentId(data.payment_id);

      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "🎉 Payment Successful!",
        message: "Your video is now live. Download your certificate and invoice from the Upload Hub.",
        type: "certificate",
      } as any);

      toast({ title: "Payment successful! ✅", description: `Transaction: ${data.transaction_id}` });
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
    } finally { setPaying(false); }
  };

  const handleReport = async () => {
    if (!user || !selectedScoutId || !reportReason.trim()) return;
    setReporting(true);
    try {
      const { data: scoutProfile } = await supabase.from("profiles").select("full_name").eq("user_id", selectedScoutId).maybeSingle();
      const scoutName = scoutProfile?.full_name || "Unknown Scout";
      const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
      const playerName = myProfile?.full_name || "Unknown Player";

      // Notify admins only
      const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin" as any);
      if (adminRoles && adminRoles.length > 0) {
        const notifs = adminRoles.map((a) => ({
          user_id: a.user_id,
          title: `🚨 Player Report: ${scoutName}`,
          message: `Player "${playerName}" has reported scout "${scoutName}": ${reportReason}`,
          type: "info",
          metadata: { reporter_id: user.id, reported_scout_id: selectedScoutId },
        }));
        await supabase.from("notifications").insert(notifs as any);
      }

      toast({ title: "Report submitted", description: "Admin has been notified." });
      setReportOpen(false);
      setReportReason("");
      setSelectedScoutId("");
    } catch (err: any) {
      toast({ title: "Failed to submit", description: err.message, variant: "destructive" });
    } finally { setReporting(false); }
  };

  const downloadCertificate = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const name = user?.user_metadata?.full_name || "Player";
    doc.setFillColor(240, 253, 244); doc.rect(0, 0, w, h, "F");
    doc.setDrawColor(22, 163, 74); doc.setLineWidth(2); doc.rect(10, 10, w - 20, h - 20);
    doc.setFont("helvetica", "bold"); doc.setFontSize(32); doc.setTextColor(22, 163, 74);
    doc.text("DIGITAL PARTICIPATION CERTIFICATE", w / 2, 45, { align: "center" });
    doc.setLineWidth(0.5); doc.line(w / 2 - 60, 52, w / 2 + 60, 52);
    doc.setFont("helvetica", "normal"); doc.setFontSize(14); doc.setTextColor(60, 60, 60);
    doc.text("This certifies that", w / 2, 70, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.setTextColor(30, 30, 30);
    doc.text(name, w / 2, 85, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.setTextColor(80, 80, 80);
    doc.text("has successfully registered and submitted a highlight video on", w / 2, 100, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(22, 163, 74);
    doc.text("Scout BD", w / 2, 112, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(100, 100, 100);
    doc.text(`Transaction ID: ${transactionId}`, w / 2, 130, { align: "center" });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, w / 2, 138, { align: "center" });
    doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text("Scout BD — Digitizing Bangladesh Sports", w / 2, h - 18, { align: "center" });
    doc.save("ScoutBD_Certificate.pdf");
  };

  const downloadInvoice = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const name = user?.user_metadata?.full_name || "Player";
    const email = user?.email || "";
    const date = new Date().toLocaleDateString();
    doc.setFillColor(22, 163, 74); doc.rect(0, 0, w, 40, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.setTextColor(255, 255, 255);
    doc.text("SCOUT BD", 20, 25); doc.setFontSize(10); doc.text("INVOICE", w - 20, 25, { align: "right" });
    doc.setTextColor(60, 60, 60); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    let y = 55; doc.text(`Invoice Date: ${date}`, 20, y); doc.text(`Transaction ID: ${transactionId}`, 20, y + 7);
    doc.text(`Payment ID: ${paymentId || "N/A"}`, 20, y + 14);
    y = 90; doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("BILL TO", 20, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(name, 20, y + 8); doc.text(email, 20, y + 15);
    y = 125; doc.setFillColor(245, 245, 245); doc.rect(20, y, w - 40, 10, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
    doc.text("DESCRIPTION", 25, y + 7); doc.text("QTY", 120, y + 7, { align: "center" }); doc.text("AMOUNT", w - 25, y + 7, { align: "right" });
    y += 15; doc.setFont("helvetica", "normal"); doc.setTextColor(60, 60, 60);
    doc.text("Video Registration & Participation Fee", 25, y); doc.text("1", 120, y, { align: "center" }); doc.text("৳100.00", w - 25, y, { align: "right" });
    y += 10; doc.setDrawColor(200, 200, 200); doc.line(20, y, w - 20, y);
    y += 10; doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("TOTAL", 120, y, { align: "center" });
    doc.setTextColor(22, 163, 74); doc.text("৳100.00", w - 25, y, { align: "right" });
    y += 15; doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text("Payment Method: bKash", 20, y); doc.text("Status: PAID", 20, y + 7);
    doc.setFontSize(8); doc.setTextColor(170, 170, 170);
    doc.text("Scout BD — Digitizing Bangladesh Sports", w / 2, 280, { align: "center" });
    doc.save("ScoutBD_Invoice.pdf");
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-display text-4xl text-foreground mb-1">PLAYER DASHBOARD</h1>
              <p className="text-muted-foreground">Manage your profile, upload videos, and explore other players</p>
            </div>
            {/* Report a Scout button */}
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-full text-xs shrink-0">
                  <Flag className="h-3 w-3 mr-1" /> Report Scout
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl text-foreground">REPORT A SCOUT</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">Select the scout you want to report and describe the issue. Only the admin will see this.</p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Select Scout</Label>
                    <Select value={selectedScoutId} onValueChange={setSelectedScoutId}>
                      <SelectTrigger className="bg-secondary border-border mt-1">
                        <SelectValue placeholder="Choose a scout..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {scouts.map((s) => (
                          <SelectItem key={s.user_id} value={s.user_id}>
                            {s.full_name}{s.organization ? ` — ${s.organization}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Reason / Description</Label>
                    <Textarea
                      placeholder="Describe what happened..."
                      className="mt-1 bg-secondary border-border resize-none"
                      rows={3}
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleReport}
                    disabled={reporting || !selectedScoutId || !reportReason.trim()}
                    className="w-full bg-destructive text-white hover:bg-destructive/90"
                  >
                    {reporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Flag className="h-4 w-4 mr-2" />}
                    Submit Report to Admin
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Upload className="h-4 w-4 mr-1.5" /> Upload Hub
              </TabsTrigger>
              <TabsTrigger value="explore" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Eye className="h-4 w-4 mr-1.5" /> Explore Players
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <User className="h-4 w-4 mr-1.5" /> My Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-8">
              {/* Video Upload */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Video className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl text-foreground">HIGHLIGHT VIDEO</h2>
                  {videoStatus && (
                    <Badge variant={videoStatus === "live" ? "default" : "outline"} className={videoStatus === "live" ? "bg-primary text-primary-foreground" : ""}>{videoStatus}</Badge>
                  )}
                </div>

                {!videoId ? (
                  <>
                    <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer bg-secondary/50">
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-foreground font-medium mb-1">{videoFile ? videoFile.name : "Drop your video here"}</p>
                      <p className="text-xs text-muted-foreground">Max 3 minutes • MP4, MOV, AVI</p>
                      {videoFile && <p className="text-xs text-primary mt-2">✓ File selected — complete payment to upload</p>}
                    </div>
                    <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                  </>
                ) : (
                  <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-4">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="text-foreground text-sm">{paymentDone ? "Video uploaded and live!" : "Details saved — complete payment to upload video"}</span>
                  </div>
                )}
                <div className="mt-4">
                  <Label className="text-sm text-muted-foreground">Video Description (max 100 words)</Label>
                  <Textarea placeholder="Tell scouts what makes you special..." className="mt-1 bg-secondary border-border resize-none" rows={3} maxLength={600} value={description} onChange={(e) => setDescription(e.target.value)} />
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
                      <Badge key={tag} variant={selectedPositions.includes(tag) ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${selectedPositions.includes(tag) ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                        onClick={() => toggleTag(tag, selectedPositions, setSelectedPositions)}>{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Play Style</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {traitTags.map((tag) => (
                      <Badge key={tag} variant={selectedTraits.includes(tag) ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${selectedTraits.includes(tag) ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                        onClick={() => toggleTag(tag, selectedTraits, setSelectedTraits)}>{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save details (no upload yet) */}
              {!videoId && videoFile && (
                <Button onClick={handleUpload} disabled={uploading} className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Save Details & Proceed to Payment
                </Button>
              )}

              {/* Payment — only after details saved, before payment done */}
              {videoId && !paymentDone && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-xl text-foreground">PAYMENT</h2>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 text-sm text-muted-foreground">
                    💡 Your video will be uploaded <span className="text-foreground font-medium">only after</span> payment is confirmed.
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
                    <Input placeholder="01XXXXXXXXX" className="mt-1 bg-secondary border-border" value={bkashNumber} onChange={(e) => setBkashNumber(e.target.value)} />
                  </div>
                  <Button className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90" onClick={handlePayment} disabled={paying || !bkashNumber || !videoFile}>
                    {paying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {paying ? "Uploading & Processing..." : "Pay with bKash & Upload Video"}
                  </Button>
                </div>
              )}

              {/* Documents — only after payment */}
              {paymentDone && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-xl text-foreground">DOCUMENTS</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Your video is now live! Download your certificate and invoice below.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={downloadCertificate} variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
                      <Download className="h-4 w-4 mr-2" /> Download Certificate
                    </Button>
                    <Button onClick={downloadInvoice} variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
                      <FileText className="h-4 w-4 mr-2" /> Download Invoice
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="explore">
              <PlayerVideosTab />
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

export default PlayerDashboard;
