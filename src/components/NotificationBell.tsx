import { useState, useEffect } from "react";
import { Bell, Download, FileText, Award, Star, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  metadata: any;
  created_at: string;
}

const typeIcons: Record<string, typeof Info> = {
  info: Info,
  certificate: Award,
  feedback: Star,
  selection: Star,
  admin_notice: FileText,
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications((data as Notification[]) || []);
  };

  useEffect(() => {
    fetchNotifications();

    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true } as any).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true } as any).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-lg z-50 max-h-[70vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-display text-lg text-foreground">NOTIFICATIONS</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button size="sm" variant="ghost" onClick={markAllRead} className="text-xs text-primary">
                    Mark all read
                  </Button>
                )}
                <button onClick={() => setOpen(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No notifications yet</p>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcons[n.type] || Info;
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.read && markRead(n.id)}
                      className={`p-4 border-b border-border hover:bg-secondary/50 cursor-pointer transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!n.read ? "bg-primary/20" : "bg-secondary"}`}>
                          <Icon className={`h-4 w-4 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
