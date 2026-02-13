import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Shield, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { label: "Players Registered", value: "2,500+", icon: Users },
  { label: "Verified Scouts", value: "120+", icon: Shield },
  { label: "Talent Discovered", value: "340+", icon: Trophy },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-background/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="container relative z-10 pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Bangladesh Sports Revolution</span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl leading-[0.9] text-foreground mb-6">
              YOUR TALENT
              <br />
              <span className="text-gradient">DESERVES A</span>
              <br />
              STAGE
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mb-8">
              The first platform connecting Bangladesh's grassroots football & cricket talent
              with verified scouts. Safe, transparent, and built for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-primary text-primary-foreground font-bold text-lg px-8 glow hover:bg-primary/90 transition-all">
                  Join as Player <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth?role=scout">
                <Button size="lg" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-semibold text-lg px-8">
                  I'm a Scout
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-t border-border">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-card border border-border rounded-lg p-6 text-center"
              >
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="font-display text-4xl text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-3">HOW IT WORKS</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Three simple steps to showcase your talent to the world</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "CREATE PROFILE", desc: "Sign up as a Player, add your details, and select your sport — Football or Cricket." },
              { step: "02", title: "UPLOAD YOUR BEST", desc: "Record a 3-minute highlight video. Tag your position and traits. Pay ৳100 via bKash." },
              { step: "03", title: "GET DISCOVERED", desc: "Verified scouts browse your profile. Get your Digital Participation Certificate instantly." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative bg-card border border-border rounded-lg p-8 group hover:border-primary/50 transition-colors"
              >
                <span className="font-display text-6xl text-primary/20 absolute top-4 right-6">{item.step}</span>
                <h3 className="font-display text-2xl text-foreground mt-8 mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="container text-center">
          <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-4">
            READY TO <span className="text-gradient">SHINE?</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join thousands of young athletes across Bangladesh. Your breakthrough starts here.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary text-primary-foreground font-bold text-lg px-10 glow animate-pulse-glow">
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
