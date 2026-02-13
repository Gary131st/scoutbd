import { useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams, Link } from "react-router-dom";
import { Zap, Upload, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Role = "player" | "scout";
type Sport = "football" | "cricket";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(false);
  const [role, setRole] = useState<Role>(searchParams.get("role") === "scout" ? "scout" : "player");
  const [sport, setSport] = useState<Sport>("football");
  const [showPass, setShowPass] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Backend Required",
      description: "Enable Lovable Cloud to activate authentication.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-display text-2xl text-foreground">TALENTBRIDGE BD</span>
          </Link>
          <h1 className="font-display text-3xl text-foreground">
            {isLogin ? "WELCOME BACK" : "JOIN THE GAME"}
          </h1>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          {!isLogin && (
            <>
              {/* Role Selection */}
              <div className="mb-6">
                <Label className="text-sm text-muted-foreground mb-2 block">I am a</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["player", "scout"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-3 rounded-lg font-display text-lg tracking-wide transition-all border ${
                        role === r
                          ? "bg-primary text-primary-foreground border-primary glow"
                          : "bg-secondary text-secondary-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {r === "player" ? "⚽ PLAYER" : "🔍 SCOUT"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sport Selection (player only) */}
              {role === "player" && (
                <div className="mb-6">
                  <Label className="text-sm text-muted-foreground mb-2 block">Sport Category</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["football", "cricket"] as Sport[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSport(s)}
                        className={`py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                          sport === s
                            ? "bg-primary/15 text-primary border-primary/50"
                            : "bg-secondary text-secondary-foreground border-border hover:border-primary/30"
                        }`}
                      >
                        {s === "football" ? "⚽ Football" : "🏏 Cricket"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-sm text-muted-foreground">Full Name</Label>
                <Input id="name" placeholder="Your full name" required className="bg-secondary border-border" />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" required className="bg-secondary border-border" />
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="phone" className="text-sm text-muted-foreground">Phone (BD)</Label>
                <Input id="phone" placeholder="+880 1XXXXXXXXX" required className="bg-secondary border-border" />
              </div>
            )}

            <div>
              <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="bg-secondary border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && role === "player" && (
              <div>
                <Label className="text-sm text-muted-foreground">Birth Certificate / NID</Label>
                <div className="mt-1 border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-colors bg-secondary">
                  <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                  <span className="text-xs text-muted-foreground">Click to upload</span>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90">
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
