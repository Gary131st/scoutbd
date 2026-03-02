import { useEffect } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface LoadingIntroProps {
  onDone: () => void;
}

const LoadingIntro = ({ onDone }: LoadingIntroProps) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 2600);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-background flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Logo zoom + rotate */}
        <motion.div
          initial={{ scale: 0, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ delay: 0.6, duration: 0.7, ease: "easeInOut" }}
            className="w-20 h-20 rounded-2xl bg-foreground flex items-center justify-center shadow-[0_0_60px_hsl(var(--foreground)/0.2)]"
          >
            <Zap className="h-10 w-10 text-background" fill="currentColor" />
          </motion.div>
        </motion.div>

        {/* Brand name letter-by-letter */}
        <div className="flex items-center gap-0.5 overflow-hidden">
          {"SCOUT BD".split("").map((char, i) => (
            <motion.span
              key={i}
              className={`font-display text-4xl text-foreground ${char === " " ? "w-3" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.055, duration: 0.35, ease: "easeOut" }}
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          className="text-xs text-muted-foreground tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          Digitizing Bangladesh Sports
        </motion.p>

        {/* Progress bar */}
        <motion.div
          className="mt-4 h-px bg-border rounded-full overflow-hidden"
          style={{ width: 120 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <motion.div
            className="h-full bg-foreground rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.1, duration: 1.2, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingIntro;
