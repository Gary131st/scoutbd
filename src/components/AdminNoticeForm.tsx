import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminNoticeForm = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);

    // Get all user IDs
    const { data: roles } = await supabase.from("user_roles").select("user_id");
    const userIds = (roles || []).map((r) => r.user_id);

    if (userIds.length === 0) {
      toast({ title: "No users found" });
      setSending(false);
      return;
    }

    const notifications = userIds.map((uid) => ({
      user_id: uid,
      title,
      message,
      type: "admin_notice",
    }));

    const { error } = await supabase.from("notifications").insert(notifications as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Notice sent to ${userIds.length} users!` });
      setTitle("");
      setMessage("");
    }
    setSending(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="font-display text-lg text-foreground">SEND NOTICE TO ALL USERS</h3>
      <div>
        <Label className="text-sm text-muted-foreground">Title</Label>
        <Input className="mt-1 bg-secondary border-border" placeholder="Notice title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label className="text-sm text-muted-foreground">Message</Label>
        <Textarea className="mt-1 bg-secondary border-border resize-none" rows={3} placeholder="Write your notice..." value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      <Button onClick={handleSend} disabled={sending || !title.trim() || !message.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
        {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
        Broadcast Notice
      </Button>
    </div>
  );
};

export default AdminNoticeForm;
