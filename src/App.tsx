import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import MainStage from "./pages/MainStage";
import PlayerView from "./pages/PlayerView";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPlayerManagement from "./pages/AdminPlayerManagement";
import AdminDatabase from "./pages/AdminDatabase";
import TeamSummary from "./pages/TeamSummary";
import MonitorPage from "./pages/MonitorPage";
import MiniGameTestPage from "./pages/MiniGameTestPage";
import NotFound from "./pages/NotFound";

// Mini-game pages
import GrowPlusPage from "./pages/minigame/GrowPlusPage";
import SafeActPage from "./pages/minigame/SafeActPage";
import ProCarePage from "./pages/minigame/ProCarePage";
import QuestionChallengePage from "./pages/minigame/QuestionChallengePage";

// GrowPlus sub-games
import RevenueTapPage from "./pages/minigame/growplus/RevenueTapPage";
import ReferralLinkPage from "./pages/minigame/growplus/ReferralLinkPage";
import SBUComboPage from "./pages/minigame/growplus/SBUComboPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" richColors />

      <BrowserRouter>
        <Routes>
          {/* Main Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/stage" element={<MainStage />} />
          <Route path="/play" element={<PlayerView />} />
          <Route path="/monitor" element={<MonitorPage />} />
          <Route path="/test-minigames" element={<MiniGameTestPage />} />
          <Route path="/teams" element={<TeamSummary />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/players" element={<AdminPlayerManagement />} />
          <Route path="/admin/database" element={<AdminDatabase />} />

          {/* Mini-game routes */}
          <Route path="/minigame/growplus" element={<GrowPlusPage />} />
          <Route path="/minigame/safeact" element={<SafeActPage />} />
          <Route path="/minigame/procare" element={<ProCarePage />} />
          <Route path="/minigame/challenge" element={<QuestionChallengePage />} />

          {/* GrowPlus sub-games */}
          <Route path="/minigame/growplus/revenue-tap" element={<RevenueTapPage />} />
          <Route path="/minigame/growplus/referral-link" element={<ReferralLinkPage />} />
          <Route path="/minigame/growplus/sbu-combo" element={<SBUComboPage />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
