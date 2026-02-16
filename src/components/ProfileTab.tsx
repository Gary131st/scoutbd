import { useState, useEffect, useRef } from "react";
import { User, Camera, Loader2, Save, MapPin, Calendar, Phone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ProfileData {
  full_name: string;
  username: string;
  bio: string;
  phone: string;
  avatar_url: string;
  sport: string;
  gender: string;
  date_of_birth: string;
  guardian_contact: string;
}

const ProfileTab = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "", username: "", bio: "", phone: "", avatar_url: "",
    sport: "", gender: "", date_of_birth: "", guardian_contact: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setProfile({
          full_name: data.full_name || "", username: (data as any).username || "",
          bio: data.bio || "", phone: data.phone || "", avatar_url: data.avatar_url || "",
          sport: data.sport || "", gender: data.gender || "",
          date_of_birth: data.date_of_birth || "", guardian_contact: data.guardian_contact || "",
        });
      }
      setLoading(false);
    });
  }, [user]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(path);
      setProfile((p) => ({ ...p, avatar_url: publicUrl }));
      toast({ title: "Avatar uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, username: profile.username, bio: profile.bio,
      phone: profile.phone, avatar_url: profile.avatar_url, sport: profile.sport,
      gender: profile.gender, date_of_birth: profile.date_of_birth || null,
      guardian_contact: profile.guardian_contact,
    } as any).eq("user_id", user.id);

    if (error) {
      toast({ title: "Save failed", description: error.message.includes("unique") ? "Username already taken" : error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved!" });
      setEditing(false);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-0">
      {/* Instagram-style profile header */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Cover gradient */}
        <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary relative" />

        <div className="px-6 pb-6">
          {/* Avatar overlapping cover */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-card border-4 border-card overflow-hidden shadow-lg">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md"
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-display text-2xl text-foreground">{profile.full_name || "Your Name"}</h2>
              <p className="text-sm text-muted-foreground">@{profile.username || "username"}</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 text-primary rounded-full capitalize">
                <Shield className="h-3 w-3 mr-1" /> {role}
              </Badge>
              <Button
                size="sm"
                variant={editing ? "default" : "outline"}
                onClick={() => editing ? handleSave() : setEditing(true)}
                disabled={saving}
                className={editing ? "bg-primary text-primary-foreground hover:bg-primary/90 rounded-full" : "border-border text-foreground rounded-full"}
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : editing ? <Save className="h-3 w-3 mr-1" /> : null}
                {editing ? "Save" : "Edit Profile"}
              </Button>
            </div>
          </div>

          {/* Bio */}
          {!editing && profile.bio && (
            <p className="text-sm text-muted-foreground mt-4 max-w-md">{profile.bio}</p>
          )}

          {/* Quick info pills */}
          {!editing && (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.sport && <Badge variant="outline" className="text-xs border-border text-muted-foreground rounded-full">{profile.sport}</Badge>}
              {profile.gender && <Badge variant="outline" className="text-xs border-border text-muted-foreground rounded-full">{profile.gender}</Badge>}
              {profile.date_of_birth && (
                <Badge variant="outline" className="text-xs border-border text-muted-foreground rounded-full">
                  <Calendar className="h-3 w-3 mr-1" /> {new Date(profile.date_of_birth).toLocaleDateString()}
                </Badge>
              )}
              {profile.phone && (
                <Badge variant="outline" className="text-xs border-border text-muted-foreground rounded-full">
                  <Phone className="h-3 w-3 mr-1" /> {profile.phone}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</Label>
              <Input className="mt-1 bg-secondary border-border rounded-xl" value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Username</Label>
              <Input className="mt-1 bg-secondary border-border rounded-xl" placeholder="unique_username" value={profile.username} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Phone</Label>
              <Input className="mt-1 bg-secondary border-border rounded-xl" placeholder="01XXXXXXXXX" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Gender</Label>
              <Input className="mt-1 bg-secondary border-border rounded-xl" placeholder="Male / Female / Other" value={profile.gender} onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date of Birth</Label>
              <Input type="date" className="mt-1 bg-secondary border-border rounded-xl" value={profile.date_of_birth} onChange={(e) => setProfile((p) => ({ ...p, date_of_birth: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Sport</Label>
              <Input className="mt-1 bg-secondary border-border rounded-xl" placeholder="Football / Cricket" value={profile.sport} onChange={(e) => setProfile((p) => ({ ...p, sport: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Bio</Label>
            <Textarea className="mt-1 bg-secondary border-border resize-none rounded-xl" rows={3} placeholder="Tell us about yourself..." value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Guardian Contact (if under 18)</Label>
            <Input className="mt-1 bg-secondary border-border rounded-xl" placeholder="01XXXXXXXXX" value={profile.guardian_contact} onChange={(e) => setProfile((p) => ({ ...p, guardian_contact: e.target.value }))} />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProfileTab;
