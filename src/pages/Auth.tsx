import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Zap, Upload, Eye, EyeOff, Loader2, Mail, ArrowLeft, ShieldCheck, RefreshCw } from "lucide-react";
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

const RESEND_COOLDOWN = 60;

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
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resending, setResending] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  // Store form values that persist across steps
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formGender, setFormGender] = useState("");
  const [formPassword, setFormPassword] = useState("");

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (user && userRole) {
      const dest = userRole === "admin" ? "/admin" : userRole === "scout" ? "/scout" : "/player";
      navigate(dest, { replace: true });
    }
  }, [user, userRole, navigate]);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const startCountdown = () => {
    setResendCountdown(RESEND_COOLDOWN);
    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) { clearInterval(countdownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(formEmail, formPassword);
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You've been signed in." });
      } else {
        const { error } = await supabase.auth.signUp({
          email: formEmail,
          password: formPassword,
          options: { data: { full_name: formName } },
        });
        if (error) throw error;
        toast({ title: "OTP Sent! 📧", description: `Check your email for a 6-digit code.` });
        setStep("otp");
        startCountdown();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: formEmail });
      if (error) throw error;
      toast({ title: "OTP Resent! 📧", description: "A new 6-digit code has been sent to your email." });
      startCountdown();
      setOtp("");
    } catch (err: any) {
      toast({ title: "Resend failed", description: err.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: formEmail, token: otp, type: "signup" });
      if (error) throw error;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await supabase.functions.invoke("handle-signup-role", {
          body: { role: selectedRole, sport, phone: formPhone, gender: formGender, full_name: formName },
        });
        if (res.error) throw new Error(res.error.message);
        toast({
          title: "Account created! 🎉",
          description: selectedRole === "scout" ? "Your account is pending admin verification." : "Welcome to Scout BD!",
        });
        navigate(selectedRole === "scout" ? "/scout" : "/player");
      }
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const handleGoBack = () => {
    setStep("form");
    setOtp("");
    if (countdownRef.current) clearInterval(countdownRef.current);
    setResendCountdown(0);
    // DO NOT reset form values — keeps form filled when going back
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.08 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4 perspective-1000">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full max-w-md"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <motion.div whileHover={{ rotate: 15, scale: 1.2 }} transition={{ type: "spring", stiffness: 300 }}>
              <Zap className="h-6 w-6 text-primary" />
            </motion.div>
            <span className="font-display text-2xl text-foreground">SCOUT BD</span>
          </Link>
          <h1 className="font-display text-3xl text-foreground">
            {step === "otp" ? "VERIFY EMAIL" : isLogin ? "WELCOME BACK" : "JOIN THE GAME"}
          </h1>
          {step === "otp" && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-muted-foreground mt-2"
            >
              Enter the 6-digit code sent to <span className="text-primary font-medium">{formEmail}</span>
            </motion.p>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "otp" ? (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 60, rotateY: 15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -60, rotateY: -15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ transformStyle: "preserve-3d" }}
              className="bg-card border border-border rounded-2xl p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1], rotateY: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"
                >
                  <Mail className="h-10 w-10 text-primary" />
                </motion.div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">Check your inbox</p>
                <p className="text-xs text-muted-foreground">A 6-digit OTP code was sent to <span className="text-primary">{formEmail}</span></p>
              </div>

              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0,1,2,3,4,5].map(i => (
                      <InputOTPSlot key={i} index={i} className="w-10 h-12 text-base font-display bg-secondary border-border" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={verifying || otp.length < 6}
                className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all hover:shadow-[var(--shadow-glow)]"
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                Verify & Create Account
              </Button>

              {/* Resend OTP */}
              <div className="text-center">
                {resendCountdown > 0 ? (
                  <p className="text-xs text-muted-foreground">Resend available in <span className="text-primary font-semibold">{resendCountdown}s</span></p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto transition-colors disabled:opacity-50"
                  >
                    {resending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                onClick={handleGoBack}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mx-auto transition-colors group"
              >
                <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                Back to signup
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -60, rotateY: -15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: 60, rotateY: 15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ transformStyle: "preserve-3d" }}
              className="bg-card border border-border rounded-2xl p-6 shadow-2xl"
            >
              {!isLogin && (
                <>
                  <motion.div variants={itemVariants} className="mb-6">
                    <Label className="text-sm text-muted-foreground mb-2 block">I am a</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["player", "scout"] as Role[]).map((r) => (
                        <motion.button
                          key={r}
                          type="button"
                          onClick={() => setSelectedRole(r)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`py-3 rounded-xl font-display text-lg tracking-wide transition-all duration-300 border ${
                            selectedRole === r
                              ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-glow)]"
                              : "bg-secondary text-secondary-foreground border-border hover:border-primary/40"
                          }`}
                        >
                          {r === "player" ? "⚽ PLAYER" : "🔍 SCOUT"}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {selectedRole === "player" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-6 overflow-hidden"
                      >
                        <Label className="text-sm text-muted-foreground mb-2 block">Sport Category</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {(["football", "cricket"] as Sport[]).map((s) => (
                            <motion.button
                              key={s}
                              type="button"
                              onClick={() => setSport(s)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                                sport === s
                                  ? "bg-primary/15 text-primary border-primary/50"
                                  : "bg-secondary text-secondary-foreground border-border hover:border-primary/30"
                              }`}
                            >
                              {s === "football" ? "⚽ Football" : "🏏 Cricket"}
                            </motion.button>
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
                    <Input
                      id="name"
                      placeholder="Your full name"
                      required
                      className="bg-secondary border-border transition-all focus:shadow-[var(--shadow-glow)]"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </motion.div>
                )}
                <motion.div variants={itemVariants}>
                  <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="bg-secondary border-border transition-all focus:shadow-[var(--shadow-glow)]"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </motion.div>
                {!isLogin && (
                  <>
                    <motion.div variants={itemVariants}>
                      <Label htmlFor="phone" className="text-sm text-muted-foreground">Phone (BD)</Label>
                      <Input
                        id="phone"
                        placeholder="+880 1XXXXXXXXX"
                        required
                        className="bg-secondary border-border transition-all focus:shadow-[var(--shadow-glow)]"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                      />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <Label htmlFor="gender" className="text-sm text-muted-foreground">Gender</Label>
                      <select
                        id="gender"
                        className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground transition-all focus:shadow-[var(--shadow-glow)] focus:outline-none focus:ring-2 focus:ring-ring"
                        value={formGender}
                        onChange={(e) => setFormGender(e.target.value)}
                        required
                      >
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
                    <Input
                      id="password"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="bg-secondary border-border pr-10 transition-all focus:shadow-[var(--shadow-glow)]"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
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
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all duration-300 hover:shadow-[var(--shadow-glow)]"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isLogin ? "Sign In" : "Create Account"}
                    </Button>
                  </motion.div>
                </motion.div>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-4">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline font-medium transition-colors"
                >
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
