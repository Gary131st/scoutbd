import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Zap, Upload, Eye, EyeOff, Loader2, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Role = "player" | "scout";
type Sport = "football" | "cricket";
type Step = "form" | "otp";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role: userRole, signIn } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(searchParams.get("role") === "scout" ? "scout" : "player");
  const [sport, setSport] = useState<Sport>("football");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", gender: "" });

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (user && userRole) {
      const dest = userRole === "admin" ? "/admin" : userRole === "scout" ? "/scout" : "/player";
      navigate(dest, { replace: true });
    }
  }, [user, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(form.email, form.password);
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You've been signed in." });
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.name } },
        });
        if (error) throw error;
        toast({ title: "OTP Sent!", description: "Check your email for a verification code from Scout BD." });
        setStep("otp");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: form.email, token: otp, type: "signup" });
      if (error) throw error;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await supabase.functions.invoke("handle-signup-role", {
          body: { role: selectedRole, sport, phone: form.phone, gender: form.gender, full_name: form.name },
        });
        if (res.error) throw new Error(res.error.message);
        toast({ title: "Account created!", description: selectedRole === "scout" ? "Your account is pending admin verification." : "Welcome to Scout BD!" });
        navigate(selectedRole === "scout" ? "/scout" : "/player");
      }
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.08 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4">
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full max-w-md">
        <motion.div variants={itemVariants} className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <Zap className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
            <span className="font-display text-2xl text-foreground">SCOUT BD</span>
          </Link>
          <h1 className="font-display text-3xl text-foreground">
            {step === "otp" ? "VERIFY EMAIL" : isLogin ? "WELCOME BACK" : "JOIN THE GAME"}
          </h1>
          {step === "otp" && (
            <p className="text-sm text-muted-foreground mt-2">Enter the 6-digit code sent to <span className="text-primary">{form.email}</span></p>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "otp" ? (
            <motion.div key="otp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }} className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0,1,2,3,4,5].map(i => (
                      <InputOTPSlot key={i} index={i} className="w-12 h-14 text-lg font-display bg-secondary border-border" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button onClick={handleVerifyOtp} disabled={verifying || otp.length < 6}
                className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all hover:shadow-[var(--shadow-glow)]">
                {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify & Create Account
              </Button>
              <button onClick={() => { setStep("form"); setOtp(""); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to signup
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }} className="bg-card border border-border rounded-xl p-6">
              {!isLogin && (
                <>
                  <motion.div variants={itemVariants} className="mb-6">
                    <Label className="text-sm text-muted-foreground mb-2 block">I am a</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["player", "scout"] as Role[]).map((r) => (
                        <button key={r} type="button" onClick={() => setSelectedRole(r)}
                          className={`py-3 rounded-lg font-display text-lg tracking-wide transition-all duration-300 border ${
                            selectedRole === r
                              ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-glow)] scale-[1.02]"
                              : "bg-secondary text-secondary-foreground border-border hover:border-primary/40 hover:scale-[1.01]"
                          }`}>
                          {r === "player" ? "⚽ PLAYER" : "🔍 SCOUT"}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {selectedRole === "player" && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }} className="mb-6 overflow-hidden">
                        <Label className="text-sm text-muted-foreground mb-2 block">Sport Category</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {(["football", "cricket"] as Sport[]).map((s) => (
                            <button key={s} type="button" onClick={() => setSport(s)}
                              className={`py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 border ${
                                sport === s
                                  ? "bg-primary/15 text-primary border-primary/50 scale-[1.02]"
                                  : "bg-secondary text-secondary-foreground border-border hover:border-primary/30 hover:scale-[1.01]"
                              }`}>
                              {s === "football" ? "⚽ Football" : "🏏 Cricket"}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <motion.div variants={itemVariants}>
                    <Label htmlFor="name" className="text-sm text-muted-foreground">Full Name</Label>
                    <Input id="name" placeholder="Your full name" required className="bg-secondary border-border transition-all focus:shadow-[var(--shadow-glow)]"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </motion.div>
                )}
                <motion.div variants={itemVariants}>
                  <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" required className="bg-secondary border-border transition-all focus:shadow-[var(--shadow-glow)]"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </motion.div>
                {!isLogin && (
                  <>
                    <motion.div variants={itemVariants}>
                      <Label htmlFor="phone" className="text-sm text-muted-foreground">Phone (BD)</Label>
                      <Input id="phone" placeholder="+880 1XXXXXXXXX" required className="bg-secondary border-border transition-all focus:shadow-[var(--shadow-glow)]"
                        value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <Label htmlFor="gender" className="text-sm text-muted-foreground">Gender</Label>
                      <select id="gender" className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground transition-all focus:shadow-[var(--shadow-glow)] focus:outline-none focus:ring-2 focus:ring-ring"
                        value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </motion.div>
                  </>
                )}
                <motion.div variants={itemVariants}>
                  <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPass ? "text" : "password"} placeholder="••••••••" required minLength={6}
                      className="bg-secondary border-border pr-10 transition-all focus:shadow-[var(--shadow-glow)]"
                      value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>
                {!isLogin && selectedRole === "player" && (
                  <motion.div variants={itemVariants}>
                    <Label className="text-sm text-muted-foreground">Birth Certificate / NID</Label>
                    <div className="mt-1 border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-all duration-300 bg-secondary hover:bg-secondary/80">
                      <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <span className="text-xs text-muted-foreground">Click to upload</span>
                    </div>
                  </motion.div>
                )}
                <motion.div variants={itemVariants}>
                  <Button type="submit" disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all duration-300 hover:shadow-[var(--shadow-glow)] hover:scale-[1.01] active:scale-[0.99]">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isLogin ? "Sign In" : "Create Account"}
                  </Button>
                </motion.div>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-4">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium transition-colors">
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Auth;
