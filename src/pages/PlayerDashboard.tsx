import { motion } from "framer-motion";
import { Upload, Tag, CreditCard, Award, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const footballTags = ["Striker", "Defender", "Goalkeeper", "Midfielder", "Winger"];
const traitTags = ["Tactical", "Pace Abuser", "Freestyler", "Classical", "Aggressive"];

const PlayerDashboard = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { toast } = useToast();

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl text-foreground mb-2">UPLOAD HUB</h1>
          <p className="text-muted-foreground mb-8">Showcase your skills to verified scouts across Bangladesh</p>

          <div className="space-y-8">
            {/* Video Upload */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Video className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl text-foreground">HIGHLIGHT VIDEO</h2>
              </div>
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer bg-secondary/50">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">Drop your video here</p>
                <p className="text-xs text-muted-foreground">Max 3 minutes • MP4, MOV, AVI</p>
              </div>
              <div className="mt-4">
                <Label className="text-sm text-muted-foreground">Video Description (max 100 words)</Label>
                <Textarea
                  placeholder="Tell scouts what makes you special..."
                  className="mt-1 bg-secondary border-border resize-none"
                  rows={3}
                  maxLength={600}
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
                  {footballTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                      onClick={() => toggleTag(tag)}
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
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl text-foreground">PAYMENT</h2>
              </div>
              <div className="flex items-center justify-between bg-secondary rounded-lg p-4">
                <div>
                  <p className="text-foreground font-medium">Participation Fee</p>
                  <p className="text-xs text-muted-foreground">One-time payment via bKash</p>
                </div>
                <span className="font-display text-3xl text-primary">৳100</span>
              </div>
              <Button
                className="w-full mt-4 bg-primary text-primary-foreground font-bold hover:bg-primary/90 glow"
                onClick={() =>
                  toast({ title: "Payment", description: "bKash integration requires backend setup." })
                }
              >
                Pay with bKash & Go Live
              </Button>
            </div>

            {/* Certificate Preview */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl text-foreground">DIGITAL CERTIFICATE</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                After payment, you'll receive a downloadable Digital Participation Certificate — your official proof of entry into the TalentBridge BD network.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
