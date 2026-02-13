import { motion } from "framer-motion";
import { Search, Filter, Play, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mockPlayers = [
  { id: 1, name: "Rafiqul Islam", sport: "Football", position: "Striker", traits: ["Pace Abuser", "Aggressive"], location: "Dhaka", age: 17 },
  { id: 2, name: "Tanvir Ahmed", sport: "Football", position: "Midfielder", traits: ["Tactical", "Classical"], location: "Chittagong", age: 19 },
  { id: 3, name: "Sakib Hasan", sport: "Cricket", position: "All-rounder", traits: ["Aggressive", "Tactical"], location: "Rajshahi", age: 16 },
  { id: 4, name: "Nayeem Uddin", sport: "Football", position: "Goalkeeper", traits: ["Classical"], location: "Sylhet", age: 20 },
  { id: 5, name: "Arif Rahman", sport: "Cricket", position: "Bowler (Fast)", traits: ["Pace Abuser"], location: "Khulna", age: 18 },
  { id: 6, name: "Jubayer Khan", sport: "Football", position: "Winger", traits: ["Freestyler", "Pace Abuser"], location: "Barisal", age: 17 },
];

const ScoutDashboard = () => {
  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl text-foreground mb-2">TALENT DATABASE</h1>
          <p className="text-muted-foreground mb-8">Browse verified players from across Bangladesh</p>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, position, or location..." className="pl-10 bg-card border-border" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:border-primary/40">
                <Filter className="h-4 w-4 mr-1" /> Football
              </Button>
              <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:border-primary/40">
                <Filter className="h-4 w-4 mr-1" /> Cricket
              </Button>
            </div>
          </div>

          {/* Player Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockPlayers.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/40 transition-all"
              >
                {/* Video placeholder */}
                <div className="relative aspect-video bg-secondary flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Play className="h-5 w-5 text-primary ml-0.5" />
                  </div>
                  <Badge className="absolute top-2 left-2 bg-primary/20 text-primary border-0 text-xs">
                    {player.sport}
                  </Badge>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{player.name}</h3>
                    <span className="text-xs text-muted-foreground">Age {player.age}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <MapPin className="h-3 w-3" />
                    {player.location}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                      {player.position}
                    </Badge>
                    {player.traits.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs border-border text-muted-foreground">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ScoutDashboard;
