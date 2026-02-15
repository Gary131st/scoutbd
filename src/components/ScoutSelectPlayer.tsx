import { useState } from "react";
import { UserPlus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  playerId: string;
  playerName: string;
}

const ScoutSelectPlayer = ({ playerId, playerName }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("scout_requests").insert({
      scout_id: user.id,
      player_id: playerId,
      notes,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request sent!", description: `Details for ${playerName} requested. Admin will review.` });
      setSubmitted(true);
      setOpen(false);
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <Button size="sm" variant="outline" disabled className="border-primary/40 text-primary">
        <UserPlus className="h-4 w-4 mr-1" /> Requested
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <UserPlus className="h-4 w-4 mr-1" /> Select Player
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">REQUEST PLAYER DETAILS</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Request further details about <span className="text-foreground font-medium">{playerName}</span>. The admin will review and forward the player's information.
        </p>
        <Textarea
          placeholder="Why are you interested in this player? (optional)"
          className="bg-secondary border-border resize-none"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          Send Request to Admin
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ScoutSelectPlayer;
