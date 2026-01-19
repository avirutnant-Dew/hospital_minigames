import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Monitor, Smartphone, Settings, QrCode, Copy, Users } from "lucide-react";

export default function Index() {
  const baseUrl = window.location.origin;
  const playerLink = `${baseUrl}/play`;
  const captainLink = `${baseUrl}/play?captain=true`;

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="glass-card p-8 lg:p-12 max-w-2xl w-full space-y-8 animate-fade-in-up relative z-10">
        {/* Logo & Title */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <Activity className="w-20 h-20 mx-auto text-primary" />
            <div className="absolute inset-0 animate-ping">
              <Activity className="w-20 h-20 mx-auto text-primary opacity-20" />
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-display font-bold leading-tight">
            <span className="text-gradient">Hospital</span>
            <br />
            <span className="text-foreground">Game of Life</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            โรงพยาบาลพริ้นซ์ ปากน้ำโพ
            <br />
            <span className="text-accent font-semibold">Smart Hospital 2026</span>
          </p>

          <div className="neon-line max-w-xs mx-auto" />

          <p className="text-sm text-muted-foreground">
            590 คน • 5 ทีม • เป้าหมาย <span className="text-accent font-semibold">1,150 MB</span>
          </p>
        </div>

        {/* Entry Points */}
        <div className="grid gap-4">
          <Link to="/stage">
            <Button
              size="lg"
              className="w-full h-16 text-lg font-display font-bold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              <Monitor className="w-6 h-6 mr-3" />
              Main Stage (Projector)
            </Button>
          </Link>

          <div className="grid grid-cols-3 gap-4">
            <Link to="/teams">
              <Button
                size="lg"
                variant="outline"
                className="w-full h-14 font-display font-semibold hover:bg-secondary/10 hover:border-secondary transition-all"
              >
                <Users className="w-5 h-5 mr-2" />
                Team Summary
              </Button>
            </Link>

            <Link to="/play">
              <Button
                size="lg"
                variant="outline"
                className="w-full h-14 font-display font-semibold hover:bg-accent/10 hover:border-accent transition-all"
              >
                <Smartphone className="w-5 h-5 mr-2" />
                เข้าร่วมเกม
              </Button>
            </Link>

            <Link to="/admin">
              <Button
                size="lg"
                variant="outline"
                className="w-full h-14 font-display font-semibold hover:bg-primary/10 hover:border-primary transition-all"
              >
                <Settings className="w-5 h-5 mr-2" />
                Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* QR Code Hint */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <QrCode className="w-4 h-4" />
          <span>สแกน QR Code เพื่อเข้าร่วมเกมจากมือถือ</span>
        </div>

        {/* Links */}
        <div className="space-y-3">
          <div className="glass-card p-4 bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">Player Link</div>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => copyText(playerLink)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <code className="text-accent break-all text-sm">{playerLink}</code>
          </div>

          <div className="glass-card p-4 bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">Captain Link</div>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => copyText(captainLink)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <code className="text-accent break-all text-sm">{captainLink}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
