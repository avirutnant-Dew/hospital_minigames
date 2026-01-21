import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Star, Shield, Heart, Target, Sparkles, Zap } from "lucide-react";

export type StrategyType = "GROW_PLUS" | "SAFE_ACT" | "PRO_CARE";

export interface Mission {
  id: string;
  category: StrategyType;
  title: string;
  description: string;
  targetMetric: string;
  points: number;
  suggestedGameType?: string;
}

// Mission pool now directly maps to Mini-Games
export const MISSION_POOL: Mission[] = [
  // ======================
  // GROW_PLUS GAMES
  // ======================
  {
    id: "gp_revenue",
    category: "GROW_PLUS",
    title: "Revenue Tap",
    description: "Tap rapidly to generate revenue for the hospital!",
    targetMetric: "Max Score",
    points: 50,
    suggestedGameType: "REVENUE_TAP"
  },
  {
    id: "gp_sbu",
    category: "GROW_PLUS",
    title: "SBU Combo",
    description: "Match the rotating SBU zones to boost synergy!",
    targetMetric: "High Combo",
    points: 50,
    suggestedGameType: "SBU_COMBO"
  },
  {
    id: "gp_referral",
    category: "GROW_PLUS",
    title: "Referral Link",
    description: "Connect patient referrals to the right centers.",
    targetMetric: "Fast Links",
    points: 45,
    suggestedGameType: "REFERRAL_LINK"
  },
  {
    id: "gp_network",
    category: "GROW_PLUS",
    title: "Hospital Network",
    description: "Build a strong network across the region.",
    targetMetric: "Network Size",
    points: 55,
    suggestedGameType: "HOSPITAL_NETWORK"
  },
  {
    id: "gp_dept",
    category: "GROW_PLUS",
    title: "Department Efficiency",
    description: "Manage patient flow through departments efficiently.",
    targetMetric: "Flow Rate",
    points: 60,
    suggestedGameType: "DEPARTMENT_EFFICIENCY"
  },

  // ======================
  // SAFE_ACT GAMES
  // ======================
  {
    id: "sa_hazard",
    category: "SAFE_ACT",
    title: "Hazard Popper",
    description: "Identify and eliminate safety hazards in the hospital.",
    targetMetric: "Zero Hazards",
    points: 50,
    suggestedGameType: "HAZARD_POPPER"
  },
  {
    id: "sa_risk",
    category: "SAFE_ACT",
    title: "Risk Defender",
    description: "Swipe to identify risks vs safe behaviors.",
    targetMetric: "High Accuracy",
    points: 50,
    suggestedGameType: "RISK_DEFENDER"
  },
  {
    id: "sa_critical",
    category: "SAFE_ACT",
    title: "Critical Sync",
    description: "Sync the team to keep patient vitals stable.",
    targetMetric: "Stable Vitals",
    points: 60,
    suggestedGameType: "CRITICAL_SYNC"
  },

  // ======================
  // PRO_CARE GAMES
  // ======================
  {
    id: "pc_heart",
    category: "PRO_CARE",
    title: "Heart Collector",
    description: "Collect hearts to improve patient satisfaction.",
    targetMetric: "Max Hearts",
    points: 50,
    suggestedGameType: "HEART_COLLECTOR"
  },
  {
    id: "pc_empathy",
    category: "PRO_CARE",
    title: "Empathy Echo",
    description: "Choose the most empathetic response for patients.",
    targetMetric: "Empathy Score",
    points: 50,
    suggestedGameType: "EMPATHY_ECHO"
  },
  {
    id: "pc_smile",
    category: "PRO_CARE",
    title: "Smile Sparkle",
    description: "Make patients smile with excellent service.",
    targetMetric: "Happy Patients",
    points: 45,
    suggestedGameType: "SMILE_SPARKLE"
  },
];

interface MissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartChallenge: (mission: Mission) => void;
  isCaptainOrAdmin?: boolean;
  tileType?: string | null;
}

// Map tile type to mission category
const getMissionCategoryFromTile = (tileType: string | null | undefined): StrategyType | null => {
  switch (tileType) {
    case "grow":
      return "GROW_PLUS";
    case "safe":
      return "SAFE_ACT";
    case "care":
      return "PRO_CARE";
    default:
      return null; // For bonus or other tiles, pick from all
  }
};

export function MissionModal({
  open,
  onOpenChange,
  onStartChallenge,
  isCaptainOrAdmin = false,
  tileType,
}: MissionModalProps) {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isRevealing, setIsRevealing] = useState(true);

  // Auto-randomize mission when modal opens - filtered by tile type
  useEffect(() => {
    if (open) {
      setIsRevealing(true);
      setSelectedMission(null);

      // Filter mission pool based on tile type
      const categoryFilter = getMissionCategoryFromTile(tileType);
      const filteredPool = categoryFilter
        ? MISSION_POOL.filter((m) => m.category === categoryFilter)
        : MISSION_POOL;

      const randomMission =
        filteredPool[Math.floor(Math.random() * filteredPool.length)];

      // Delay reveal for dramatic effect
      const timer = setTimeout(() => {
        setSelectedMission(randomMission);
        setIsRevealing(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [open, tileType]);

  // Reset state when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedMission(null);
      setIsRevealing(true);
    }
    onOpenChange(newOpen);
  };

  const getCategoryConfig = (category: StrategyType) => {
    switch (category) {
      case "GROW_PLUS":
        return {
          icon: Star,
          label: "GROW+",
          colorClass: "text-strategy-grow",
          bgClass: "bg-strategy-grow/20",
          borderClass: "border-strategy-grow",
          gradientClass: "from-strategy-grow to-yellow-400",
        };
      case "SAFE_ACT":
        return {
          icon: Shield,
          label: "SAFE ACT",
          colorClass: "text-strategy-safe",
          bgClass: "bg-strategy-safe/20",
          borderClass: "border-strategy-safe",
          gradientClass: "from-strategy-safe to-emerald-400",
        };
      case "PRO_CARE":
        return {
          icon: Heart,
          label: "PRO CARE",
          colorClass: "text-strategy-care",
          bgClass: "bg-strategy-care/20",
          borderClass: "border-strategy-care",
          gradientClass: "from-strategy-care to-pink-400",
        };
    }
  };

  const config = selectedMission
    ? getCategoryConfig(selectedMission.category)
    : null;
  const CategoryIcon = config?.icon || Star;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent">
        <div
          className={cn(
            "relative rounded-2xl overflow-hidden",
            "bg-gradient-to-br from-background via-background to-muted",
            "border-2",
            config?.borderClass || "border-primary/50"
          )}
        >
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className={cn(
                "absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-30",
                config?.bgClass || "bg-primary/30"
              )}
            />
            <div
              className={cn(
                "absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-3xl opacity-30",
                config?.bgClass || "bg-accent/30"
              )}
            />
          </div>

          {/* Content */}
          <div className="relative p-8">
            {/* Loading State */}
            {isRevealing && (
              <div className="flex flex-col items-center justify-center py-16 animate-pulse">
                <div className="relative">
                  <Sparkles className="w-20 h-20 text-accent animate-spin" />
                  <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-primary" />
                </div>
                <p className="mt-6 text-xl font-display font-bold text-gradient">
                  กำลังสุ่มภารกิจ...
                </p>
              </div>
            )}

            {/* Mission Revealed */}
            {!isRevealing && selectedMission && config && (
              <div className="animate-scale-in space-y-6">
                <DialogHeader className="text-center space-y-4">
                  {/* Category Badge */}
                  <div className="flex justify-center">
                    <div
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-full font-display font-bold",
                        config.bgClass,
                        config.colorClass
                      )}
                    >
                      <CategoryIcon className="w-5 h-5" />
                      <span>{config.label}</span>
                    </div>
                  </div>

                  {/* Mission Title */}
                  <DialogTitle className="text-3xl font-display font-bold">
                    <span
                      className={cn(
                        "bg-gradient-to-r bg-clip-text text-transparent",
                        config.gradientClass
                      )}
                    >
                      {selectedMission.title}
                    </span>
                  </DialogTitle>

                  {/* Mission Description */}
                  <DialogDescription className="text-lg leading-relaxed">
                    {selectedMission.description}
                  </DialogDescription>
                </DialogHeader>

                {/* Target Metric */}
                <div
                  className={cn(
                    "flex items-center justify-center gap-3 p-4 rounded-xl",
                    config.bgClass,
                    "border",
                    config.borderClass
                  )}
                >
                  <Target className={cn("w-6 h-6", config.colorClass)} />
                  <span className="font-display font-bold text-lg">
                    เป้าหมาย: {selectedMission.targetMetric}
                  </span>
                </div>

                {/* Points */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-2xl font-display font-bold">
                    <Star className="w-8 h-8 text-accent" />
                    <span className="text-gradient">
                      +{selectedMission.points} คะแนน
                    </span>
                  </div>
                </div>

                {/* Start Challenge Button */}
                {isCaptainOrAdmin && (
                  <Button
                    size="lg"
                    onClick={() => onStartChallenge(selectedMission)}
                    className={cn(
                      "w-full h-16 text-xl font-display font-bold",
                      "bg-gradient-to-r",
                      config.gradientClass,
                      "hover:opacity-90 transition-opacity",
                      "shadow-lg shadow-primary/30"
                    )}
                  >
                    <Zap className="w-6 h-6 mr-2" />
                    Start Challenge
                  </Button>
                )}

                {/* Waiting Message for Crew */}
                {!isCaptainOrAdmin && (
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">
                      รอ Captain หรือ Admin กด Start Challenge...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
