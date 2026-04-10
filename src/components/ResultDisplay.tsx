import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, HelpCircle, Activity } from "lucide-react";
import { DetectionResult } from "@/lib/types";
import FrameTimeline from "./FrameTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultDisplayProps {
  result: DetectionResult;
  media?: { url: string; type: "image" | "video" } | null;
}

const config = {
  REAL: {
    icon: ShieldCheck,
    label: "AUTHENTIC",
    subtitle: "No deepfake manipulation detected",
    colorClass: "text-success",
    bgClass: "bg-success/10 border-success/20",
    glowClass: "glow-success",
    barClass: "bg-success",
  },
  FAKE: {
    icon: ShieldAlert,
    label: "DEEPFAKE DETECTED",
    subtitle: "Manipulation artifacts identified",
    colorClass: "text-danger",
    bgClass: "bg-danger/10 border-danger/20",
    glowClass: "glow-danger",
    barClass: "bg-danger",
  },
  UNCERTAIN: {
    icon: HelpCircle,
    label: "INCONCLUSIVE",
    subtitle: "Unable to determine with high confidence",
    colorClass: "text-warning",
    bgClass: "bg-warning/10 border-warning/20",
    glowClass: "glow-warning",
    barClass: "bg-warning",
  },
};

export default function ResultDisplay({ result, media }: ResultDisplayProps) {
  const c = config[result.label];
  const Icon = c.icon;
  const pct = Math.round(result.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Media preview */}
      {media && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl overflow-hidden border border-border bg-muted/20"
        >
          {media.type === "video" ? (
            <video 
              src={media.url} 
              controls 
              className="w-full max-h-96 object-contain"
            />
          ) : (
            <img 
              src={media.url} 
              alt="Analyzed media" 
              className="w-full max-h-96 object-contain"
            />
          )}
        </motion.div>
      )}

      {/* Main result card */}
      <div className={`glass-card p-4 sm:p-6 border ${c.bgClass} ${c.glowClass}`}>
        <div className="flex items-start sm:items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${c.bgClass} shrink-0`}
          >
            <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${c.colorClass}`} />
          </motion.div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold font-mono tracking-wider ${c.colorClass}`}>
              {c.label}
            </h3>
            <p className="text-muted-foreground text-sm">{c.subtitle}</p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              Confidence Level
            </span>
            <span className={`text-sm font-mono font-bold ${c.colorClass}`}>{pct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${c.barClass}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Video timeline */}
      {result.timeline && result.timeline.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 font-mono">
              <Activity className="w-4 h-4 text-primary" />
              Frame-Level Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">
              Fake probability per sampled frame
            </p>
            <FrameTimeline timeline={result.timeline} />
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

