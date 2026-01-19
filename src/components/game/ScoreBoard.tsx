import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Shield, Heart, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  color: string;
  current_tile: number;
  revenue_score: number; // THB
  safety_score: number; // points
  service_score: number; // points (ProCare/Service)
}

interface GameState {
  total_revenue: number; // (optional) THB
  target_revenue: number; // THB
}

// ======= CONFIG =======
// ถ้า game_state ไม่มี target_revenue หรือยังโหลดไม่ทัน ให้ใช้ค่าคงที่นี้
const FALLBACK_TARGET_REVENUE_THB = 1150000000; // 1,150,000,000 THB

// ถ้าต้องการ “แปลงคะแนนเป็นเงิน” ตั้งค่าเรทตรงนี้ (THB ต่อ 1 คะแนน)
const SAFETY_POINT_TO_THB = 1; // เช่น 10000 = 10,000 บาทต่อ 1 คะแนน
const SERVICE_POINT_TO_THB = 1; // เช่น 5000  = 5,000 บาทต่อ 1 คะแนน
// ตั้งเป็น 0 หมายถึง “ยังไม่แปลงคะแนนเป็นเงิน” (default ปลอดภัย)

const toMB = (thb: number) => thb / 1_000_000;

const formatNumber = (value: number, fractionDigits = 0) =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

const formatRevenueMB = (thb: number, fractionDigits = 1) => `${formatNumber(toMB(thb), fractionDigits)} MB`;

export function ScoreBoard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [teamsRes, stateRes] = await Promise.all([
        supabase.from("teams").select("*").order("revenue_score", { ascending: false }),
        supabase.from("game_state").select("*").limit(1).single(),
      ]);

      if (teamsRes.data) setTeams(teamsRes.data as Team[]);
      if (stateRes.data) setGameState(stateRes.data as GameState);
    };

    fetchData();

    const channel = supabase
      .channel("scores-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_state" }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const targetRevenueTHB = gameState?.target_revenue ?? FALLBACK_TARGET_REVENUE_THB;

  const totalRevenueTHB = useMemo(() => teams.reduce((sum, team) => sum + (team.revenue_score ?? 0), 0), [teams]);

  const progressPercent = targetRevenueTHB > 0 ? (totalRevenueTHB / targetRevenueTHB) * 100 : 0;

  // (Optional) แปลงคะแนนเป็นเงิน เพื่อรวมเป็น “ยอดเงินรวม”
  const teamMoneyBonusTHB = (team: Team) =>
    (team.safety_score ?? 0) * SAFETY_POINT_TO_THB + (team.service_score ?? 0) * SERVICE_POINT_TO_THB;

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Hospital Revenue Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-display font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            เป้าหมายโรงพยาบาล
          </h3>

          <div className="text-right">
            <div className="text-2xl font-display font-bold text-gradient leading-tight">
              {formatRevenueMB(totalRevenueTHB, 1)} / {formatRevenueMB(targetRevenueTHB, 0)}
            </div>
            <div className="text-xs text-muted-foreground">(Revenue แสดงเป็น MB = ล้านบาท)</div>
          </div>
        </div>

        <div className="relative">
          <Progress value={Math.min(progressPercent, 100)} className="h-4 bg-muted" />
          <div
            className="absolute inset-0 h-4 rounded-full overflow-hidden"
            style={{
              background: `linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)) ${Math.min(
                progressPercent,
                100,
              )}%, transparent ${Math.min(progressPercent, 100)}%)`,
              boxShadow: "0 0 20px hsl(var(--accent) / 0.5)",
            }}
          />
        </div>

        <p className="text-sm text-muted-foreground text-center">
          590 คน มุ่งสู่ {formatRevenueMB(targetRevenueTHB, 0)}
        </p>
      </div>

      <div className="neon-line" />

      {/* Team Scores */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <h4 className="font-display font-semibold">คะแนนทีม</h4>
          <div className="text-xs text-muted-foreground">
            แสดง: <span className="font-medium">Revenue (MB)</span> |{" "}
            <span className="font-medium">คะแนนรวม (Safety+Service)</span>
          </div>
        </div>

        <div className="space-y-2">
          {teams.map((team, index) => {
            const qualityPoints = (team.safety_score ?? 0) + (team.service_score ?? 0);

            // ถ้าเปิดแปลงคะแนนเป็นเงิน (ตั้ง rate > 0) จะคำนวณเงินรวมให้ด้วย
            const bonusTHB = teamMoneyBonusTHB(team);
            const totalMoneyTHB = (team.revenue_score ?? 0) + bonusTHB;

            const showMoneyTotal = SAFETY_POINT_TO_THB > 0 || SERVICE_POINT_TO_THB > 0;

            return (
              <div
                key={team.id}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg bg-muted/30 transition-all hover:bg-muted/50",
                  index === 0 && "ring-2 ring-accent",
                )}
              >
                {/* Rank */}
                <span className="text-lg font-display font-bold w-10 text-center">#{index + 1}</span>

                {/* Team Color & Name */}
                <div className="flex items-center gap-2 min-w-[180px]">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
                  <span className="font-semibold truncate">{team.name}</span>
                </div>

                {/* Revenue (MB) | Quality Points */}
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-strategy-grow" />
                    <div>
                      <div className="text-sm text-muted-foreground">Revenue (MB)</div>
                      <div className="font-display font-bold">{formatRevenueMB(team.revenue_score ?? 0, 1)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-strategy-safe" />
                    <Heart className="w-4 h-4 text-strategy-care -ml-1" />
                    <div>
                      <div className="text-sm text-muted-foreground">คะแนนรวม (Safe+Care)</div>
                      <div className="font-display font-bold">{formatNumber(qualityPoints, 0)}</div>
                    </div>
                  </div>
                </div>

                {/* (Optional) Total Money (MB) */}
                {showMoneyTotal ? (
                  <div className="text-right w-[150px]">
                    <div className="text-sm text-muted-foreground">Total (MB)</div>
                    <div className="text-xl font-display font-bold text-gradient">
                      {formatRevenueMB(totalMoneyTHB, 1)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">+โบนัส {formatRevenueMB(bonusTHB, 1)}</div>
                  </div>
                ) : (
                  <div className="text-right w-[120px]">
                    <div className="text-sm text-muted-foreground">—</div>
                    <div className="text-xl font-display font-bold text-gradient">
                      {/* โชว์รวมแบบ “ไม่สับสน”: ไม่เอาเงิน+คะแนนไปบวกกัน */}
                      {formatRevenueMB(team.revenue_score ?? 0, 0)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Hint */}
        <div className="text-xs text-muted-foreground pt-2">
          หมายเหตุ: ถ้าต้องการให้ “Safety/ProCare กลายเป็นเงิน” ให้ตั้งค่า{" "}
          <span className="font-mono">SAFETY_POINT_TO_THB</span> และ{" "}
          <span className="font-mono">SERVICE_POINT_TO_THB</span> มากกว่า 0
        </div>
      </div>
    </div>
  );
}
