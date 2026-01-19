import { useSearchParams } from "react-router-dom";
import { GrowPlusController } from "@/components/game/growplus/GrowPlusController";

export default function SBUComboPage() {
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get("team") || undefined;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="w-full max-w-4xl">
        <GrowPlusController teamId={teamId} isMainStage={true} />
      </div>
    </div>
  );
}
