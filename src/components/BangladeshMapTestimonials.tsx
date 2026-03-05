import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Quote } from "lucide-react";
import playerRafiq from "@/assets/player-rafiq.jpg";
import playerTanjim from "@/assets/player-tanjim.jpg";
import playerNusrat from "@/assets/player-nusrat.jpg";
import bangladeshMap from "@/assets/bangladesh-divisions-map.png";

type PlayerPin = {
  id: string;
  // percentage positions relative to map image container
  x: number;
  y: number;
  district: string;
  name: string;
  sport: string;
  position: string;
  issue: string;
  story: string;
  image: string;
  defaultOpen?: boolean;
};

const players: PlayerPin[] = [
  {
    id: "rafiq",
    x: 43,
    y: 52,
    district: "Dhaka",
    name: "Rafiqul Islam",
    sport: "Football",
    position: "Midfielder",
    issue: "No platform to showcase talent outside his locality. Spent 3 years unnoticed.",
    story: "Within weeks of uploading his highlight reel on Scout BD, three clubs reached out. He now plays for a Dhaka Premier Division club.",
    image: playerRafiq,
    defaultOpen: true,
  },
  {
    id: "tanjim",
    x: 72,
    y: 35,
    district: "Sylhet",
    name: "Tanjim Ahmed",
    sport: "Cricket",
    position: "All-rounder",
    issue: "Playing in remote Sylhet with zero scouting infrastructure. His talent was invisible.",
    story: "Scout BD connected him to a BPL franchise scout. He now holds a regional cricket contract and represents Sylhet in the National Championship.",
    image: playerTanjim,
    defaultOpen: true,
  },
  {
    id: "nusrat",
    x: 22,
    y: 68,
    district: "Khulna",
    name: "Nusrat Jahan",
    sport: "Football",
    position: "Forward",
    issue: "Female players in Khulna had no visibility — no scouts ever visited the district.",
    story: "After uploading her skills video, she received an invite to the Bangladesh Women's U-20 trials. She made the squad.",
    image: playerNusrat,
    defaultOpen: true,
  },
  { id: "p4", x: 28, y: 30, district: "Rajshahi", name: "Arif Hossain", sport: "Football", position: "Goalkeeper", issue: "Limited access to professional coaching.", story: "Now training with Rajshahi FC youth academy after being spotted on Scout BD.", image: playerRafiq },
  { id: "p5", x: 44, y: 78, district: "Barisal", name: "Sumon Dey", sport: "Cricket", position: "Fast Bowler", issue: "No way to reach metropolitan scouts from coastal Barisal.", story: "Secured a trial with a Dhaka-based cricket academy through Scout BD.", image: playerTanjim },
  { id: "p6", x: 52, y: 22, district: "Mymensingh", name: "Karim Uddin", sport: "Football", position: "Defender", issue: "Talented but invisible due to lack of local scouting.", story: "Joined Dhaka Abahani youth team after being discovered on Scout BD.", image: playerNusrat },
  { id: "p7", x: 18, y: 55, district: "Jessore", name: "Parvez Alam", sport: "Cricket", position: "Batsman", issue: "Rural player with no professional exposure.", story: "Now part of the Khulna Division U-19 cricket squad.", image: playerRafiq },
  { id: "p8", x: 56, y: 60, district: "Comilla", name: "Rony Mia", sport: "Football", position: "Winger", issue: "Played street football with no professional pathway.", story: "Discovered by a scout from Chittagong Abahani and offered a trial.", image: playerTanjim },
  { id: "p9", x: 76, y: 62, district: "Chittagong", name: "Sadia Islam", sport: "Football", position: "Midfielder", issue: "Women's football completely unscouted in Chittagong.", story: "Selected for national women's development camp after Scout BD profile.", image: playerNusrat },
  { id: "p10", x: 32, y: 12, district: "Rangpur", name: "Belal Khan", sport: "Cricket", position: "Spinner", issue: "Northern districts ignored by big club scouts.", story: "Offered contract by Rangpur Riders academy after highlight reel went viral.", image: playerRafiq },
  { id: "p11", x: 62, y: 50, district: "Noakhali", name: "Imran Hossain", sport: "Football", position: "Striker", issue: "No football clubs operating in his upazilas.", story: "Now on trial with Chittagong Kings after being spotted on Scout BD.", image: playerTanjim },
  { id: "p12", x: 36, y: 60, district: "Faridpur", name: "Mitu Akter", sport: "Football", position: "Forward", issue: "Female talent completely overlooked in rural areas.", story: "Invited to attend Bangladesh Football Federation's women's development program.", image: playerNusrat },
];

export default function BangladeshMapTestimonials() {
  const [openPins, setOpenPins] = useState<Set<string>>(new Set());
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);

  useEffect(() => {
    if (!mapVisible) return;
    // Stagger-open the 3 default pins after map animates in
    const defaults = players.filter(p => p.defaultOpen).map(p => p.id);
    defaults.forEach((id, i) => {
      setTimeout(() => {
        setOpenPins(prev => new Set([...prev, id]));
      }, 700 + i * 350);
    });
  }, [mapVisible]);

  const handlePinClick = (id: string) => {
    setActivePinId(prev => (prev === id ? null : id));
    setOpenPins(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const activePlayer = players.find(p => p.id === activePinId);

  return (
    <section className="py-12 sm:py-20 border-t border-border overflow-hidden">
      <div className="container">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="font-display text-3xl sm:text-5xl text-foreground mb-2 sm:mb-3">
            VOICES FROM ACROSS BANGLADESH
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            Every pin is a real player whose life changed. Click any pin to hear their story.
          </p>
        </motion.div>

        <div className="relative flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* ── Map ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            onAnimationComplete={() => setMapVisible(true)}
            className="relative w-full max-w-md lg:max-w-lg flex-shrink-0 mx-auto lg:mx-0"
          >
            {/* Map image — desaturated / B&W */}
            <img
              src={bangladeshMap}
              alt="Bangladesh divisions map"
              className="w-full select-none pointer-events-none"
              style={{ filter: "grayscale(1) contrast(0.85) brightness(1.15)" }}
              draggable={false}
            />

            {/* Pins overlay */}
            {players.map((player, idx) => {
              const isOpen = openPins.has(player.id);
              const isActive = activePinId === player.id;

              return (
                <motion.button
                  key={player.id}
                  initial={{ opacity: 0, scale: 0, y: -8 }}
                  animate={
                    mapVisible
                      ? { opacity: 1, scale: 1, y: 0 }
                      : { opacity: 0, scale: 0, y: -8 }
                  }
                  transition={{
                    delay: 0.15 + idx * 0.06,
                    duration: 0.4,
                    type: "spring",
                    stiffness: 260,
                    damping: 18,
                  }}
                  onClick={() => handlePinClick(player.id)}
                  className="absolute -translate-x-1/2 -translate-y-full focus:outline-none group"
                  style={{ left: `${player.x}%`, top: `${player.y}%` }}
                  aria-label={`${player.name} from ${player.district}`}
                >
                  {/* Pin SVG */}
                  <motion.div
                    animate={isActive ? { scale: 1.25 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <svg
                      viewBox="0 0 24 32"
                      className="w-6 h-8 sm:w-7 sm:h-9 drop-shadow-lg"
                      style={{ filter: isOpen ? "drop-shadow(0 0 4px hsl(var(--primary)/0.7))" : "none" }}
                    >
                      <path
                        d="M12 0C7.13 0 3 4.13 3 9c0 6.75 9 23 9 23s9-16.25 9-23C21 4.13 16.87 0 12 0z"
                        fill={isOpen ? "hsl(var(--primary))" : "hsl(var(--foreground)/0.5)"}
                        stroke={isOpen ? "hsl(var(--primary-foreground))" : "hsl(var(--background))"}
                        strokeWidth="1"
                      />
                      <circle cx="12" cy="9" r="4" fill={isOpen ? "hsl(var(--primary-foreground))" : "hsl(var(--background))"} />
                    </svg>
                  </motion.div>

                  {/* Name label badge that appears on open */}
                  <AnimatePresence>
                    {isOpen && !isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.9 }}
                        transition={{ duration: 0.25 }}
                        className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full shadow pointer-events-none"
                      >
                        {player.name.split(" ")[0]} · {player.district}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </motion.div>

          {/* ── Testimonial Panel ── */}
          <div className="w-full lg:max-w-sm lg:flex-shrink-0 sticky top-24">
            <AnimatePresence mode="wait">
              {activePlayer ? (
                <motion.div
                  key={activePlayer.id}
                  initial={{ opacity: 0, x: 24, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -24, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="bg-card border border-primary/30 rounded-2xl overflow-hidden shadow-2xl"
                >
                  {/* Player photo — full visible, taller */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={activePlayer.image}
                      alt={activePlayer.name}
                      className="w-full h-full object-cover object-top"
                    />
                    {/* Only a very subtle gradient at the very bottom so face is clear */}
                    <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-card/80 to-transparent" />

                    {/* Close */}
                    <button
                      onClick={() => setActivePinId(null)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors shadow"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    {/* District badge — bottom-left, only over the gradient area */}
                    <div className="absolute bottom-3 left-4 flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <MapPin className="h-3 w-3 text-primary-foreground" />
                      <span className="text-xs font-semibold text-primary-foreground">{activePlayer.district}</span>
                    </div>
                  </div>

                  {/* Name & sport row */}
                  <div className="px-5 pt-4 pb-1">
                    <h3 className="font-display text-xl text-foreground leading-tight">{activePlayer.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{activePlayer.sport} · {activePlayer.position}</p>
                  </div>

                  {/* Content blocks */}
                  <div className="px-5 pb-5 pt-3 space-y-3">
                    {/* Challenge */}
                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3">
                      <p className="text-xs font-semibold text-destructive/80 uppercase tracking-wide mb-1">The Challenge</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{activePlayer.issue}</p>
                    </div>

                    {/* Breakthrough */}
                    <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">The Breakthrough</p>
                      <div className="flex gap-2">
                        <Quote className="h-4 w-4 text-primary/50 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground leading-relaxed">{activePlayer.story}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-56 text-center gap-3 bg-card/50 border border-dashed border-border rounded-2xl p-8"
                >
                  <MapPin className="h-8 w-8 text-primary/40" />
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Click any location pin on the map<br />to read a player's story
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick-select chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {players.filter(p => p.defaultOpen).map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePinClick(p.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    activePinId === p.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {p.name.split(" ")[0]} · {p.district}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 32" className="w-4 h-5"><path d="M12 0C7.13 0 3 4.13 3 9c0 6.75 9 23 9 23s9-16.25 9-23C21 4.13 16.87 0 12 0z" fill="hsl(var(--primary))" /><circle cx="12" cy="9" r="4" fill="hsl(var(--primary-foreground))" /></svg>
                <span className="text-xs text-muted-foreground">Has story</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 32" className="w-4 h-5"><path d="M12 0C7.13 0 3 4.13 3 9c0 6.75 9 23 9 23s9-16.25 9-23C21 4.13 16.87 0 12 0z" fill="hsl(var(--foreground)/0.4)" /><circle cx="12" cy="9" r="4" fill="hsl(var(--background))" /></svg>
                <span className="text-xs text-muted-foreground">More players</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
