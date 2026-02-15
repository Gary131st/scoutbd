import { useState, useEffect, useRef } from "react";
import { User, Camera, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    username: "",
    bio: "",
    phone: "",
    avatar_url: "",
    sport: "",
    gender: "",
    date_of_birth: "",
    guardian_contact: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({
            full_name: data.full_name || "",
            username: (data as any).username || "",
            bio: data.bio || "",
            phone: data.phone || "",
            avatar_url: data.avatar_url || "",
            sport: data.sport || "",
            gender: data.gender || "",
            date_of_birth: data.date_of_birth || "",
            guardian_contact: data.guardian_contact || "",
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
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        sport: profile.sport,
        gender: profile.gender,
        date_of_birth: profile.date_of_birth || null,
        guardian_contact: profile.guardian_contact,
      } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Save failed",
        description: error.message.includes("unique") ? "Username already taken" : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Profile saved!" });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-border">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
            />
          </div>
          <div>
            <h3 className="font-display text-xl text-foreground">{profile.full_name || "Your Name"}</h3>
            <p className="text-sm text-muted-foreground">@{profile.username || "username"}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Full Name</Label>
            <Input className="mt-1 bg-secondary border-border" value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Username</Label>
            <Input className="mt-1 bg-secondary border-border" placeholder="unique_username" value={profile.username} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))} />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Phone</Label>
            <Input className="mt-1 bg-secondary border-border" placeholder="01XXXXXXXXX" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Gender</Label>
            <Input className="mt-1 bg-secondary border-border" placeholder="Male / Female / Other" value={profile.gender} onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))} />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Date of Birth</Label>
            <Input type="date" className="mt-1 bg-secondary border-border" value={profile.date_of_birth} onChange={(e) => setProfile((p) => ({ ...p, date_of_birth: e.target.value }))} />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Sport</Label>
            <Input className="mt-1 bg-secondary border-border" placeholder="Football / Cricket" value={profile.sport} onChange={(e) => setProfile((p) => ({ ...p, sport: e.target.value }))} />
          </div>
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Bio</Label>
          <Textarea className="mt-1 bg-secondary border-border resize-none" rows={3} placeholder="Tell us about yourself..." value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} />
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Guardian Contact (if under 18)</Label>
          <Input className="mt-1 bg-secondary border-border" placeholder="01XXXXXXXXX" value={profile.guardian_contact} onChange={(e) => setProfile((p) => ({ ...p, guardian_contact: e.target.value }))} />
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
};

export default ProfileTab;
