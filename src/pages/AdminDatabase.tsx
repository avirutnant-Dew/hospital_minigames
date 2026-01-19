import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Database, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  HelpCircle, 
  Shield,
  RotateCcw,
  Lock,
  Unlock,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types
interface ChallengeQuestion {
  id: string;
  category: 'GROW_PLUS' | 'SAFE_ACT' | 'PRO_CARE';
  question: string;
  options: { A: string; B: string; C: string } | null;
  correct_answer: string | null;
  points: number;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  color: string;
  current_tile: number;
  revenue_score: number;
  safety_score: number;
  service_score: number;
  created_at: string;
}

interface Player {
  id: string;
  nickname: string;
  team_id: string;
  role: 'CAPTAIN' | 'CREW';
  session_id: string | null;
  created_at: string;
}

const ADMIN_PASSWORD = "princ2024admin";

export default function AdminDatabase() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("questions");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Data states
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  // Modal states
  const [editingQuestion, setEditingQuestion] = useState<ChallengeQuestion | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // Form states
  const [questionForm, setQuestionForm] = useState({
    category: 'GROW_PLUS' as ChallengeQuestion['category'],
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    correct_answer: 'A',
    points: 10,
  });

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success("เข้าสู่ระบบสำเร็จ");
    } else {
      toast.error("รหัสผ่านไม่ถูกต้อง");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
      setupRealtimeSubscriptions();
    }
  }, [isAuthenticated]);

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel("admin-db-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "challenge_questions" }, () => fetchQuestions())
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => fetchTeams())
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => fetchPlayers())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchAllData = async () => {
    await Promise.all([fetchQuestions(), fetchTeams(), fetchPlayers()]);
  };

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from("challenge_questions")
      .select("*")
      .order("category")
      .order("created_at", { ascending: false });
    if (data) setQuestions(data as ChallengeQuestion[]);
  };

  const fetchTeams = async () => {
    const { data } = await supabase.from("teams").select("*").order("name");
    if (data) setTeams(data);
  };

  const fetchPlayers = async () => {
    const { data } = await supabase.from("players").select("*").order("created_at", { ascending: false });
    if (data) setPlayers(data as Player[]);
  };

  // Question CRUD
  const handleSaveQuestion = async () => {
    setLoading(true);
    const options = { A: questionForm.optionA, B: questionForm.optionB, C: questionForm.optionC };
    
    if (editingQuestion) {
      const { error } = await supabase
        .from("challenge_questions")
        .update({
          category: questionForm.category,
          question: questionForm.question,
          options,
          correct_answer: questionForm.correct_answer,
          points: questionForm.points,
        })
        .eq("id", editingQuestion.id);

      if (!error) {
        toast.success("อัพเดทคำถามสำเร็จ");
        setEditingQuestion(null);
      }
    } else {
      const { error } = await supabase.from("challenge_questions").insert({
        category: questionForm.category,
        question: questionForm.question,
        options,
        correct_answer: questionForm.correct_answer,
        points: questionForm.points,
      });

      if (!error) {
        toast.success("เพิ่มคำถามสำเร็จ");
        setShowAddQuestion(false);
      }
    }
    
    resetQuestionForm();
    setLoading(false);
    fetchQuestions();
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("ต้องการลบคำถามนี้?")) return;
    
    const { error } = await supabase.from("challenge_questions").delete().eq("id", id);
    if (!error) {
      toast.success("ลบคำถามสำเร็จ");
      fetchQuestions();
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      category: 'GROW_PLUS',
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      correct_answer: 'A',
      points: 10,
    });
  };

  const openEditQuestion = (q: ChallengeQuestion) => {
    const opts = q.options as { A: string; B: string; C: string } | null;
    setQuestionForm({
      category: q.category,
      question: q.question,
      optionA: opts?.A || '',
      optionB: opts?.B || '',
      optionC: opts?.C || '',
      correct_answer: q.correct_answer || 'A',
      points: q.points,
    });
    setEditingQuestion(q);
  };

  // Team updates
  const handleUpdateTeam = async (teamId: string, updates: Partial<Team>) => {
    const { error } = await supabase.from("teams").update(updates).eq("id", teamId);
    if (!error) {
      toast.success("อัพเดททีมสำเร็จ");
      fetchTeams();
    }
  };

  const handleAdjustScore = async (teamId: string, scoreType: 'revenue' | 'safety' | 'service', amount: number) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const field = `${scoreType}_score` as keyof Team;
    const newScore = Math.max(0, (team[field] as number) + amount);

    await handleUpdateTeam(teamId, { [field]: newScore });
  };

  // Player management
  const handleReassignPlayer = async (playerId: string, newTeamId: string) => {
    const { error } = await supabase.from("players").update({ team_id: newTeamId }).eq("id", playerId);
    if (!error) {
      toast.success("ย้ายผู้เล่นสำเร็จ");
      fetchPlayers();
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm("ต้องการลบผู้เล่นนี้?")) return;
    
    const { error } = await supabase.from("players").delete().eq("id", playerId);
    if (!error) {
      toast.success("ลบผู้เล่นสำเร็จ");
      fetchPlayers();
    }
  };

  // Global reset
  const handleGlobalReset = async () => {
    if (!confirm("⚠️ คุณกำลังจะรีเซ็ตทั้งหมด:\n- คะแนนทุกทีมเป็น 0\n- ทุกทีมกลับช่องเริ่มต้น\n- ลบผู้เล่นทั้งหมด\n\nยืนยันหรือไม่?")) return;
    
    setLoading(true);
    
    try {
      // Reset all teams scores and tiles
      const teamIds = teams.map(t => t.id);
      for (const teamId of teamIds) {
        await supabase
          .from("teams")
          .update({ current_tile: 0, revenue_score: 0, safety_score: 0, service_score: 0 })
          .eq("id", teamId);
      }

      // Delete all players
      const playerIds = players.map(p => p.id);
      for (const playerId of playerIds) {
        await supabase.from("players").delete().eq("id", playerId);
      }

      // Reset game state
      const { data: gameStates } = await supabase.from("game_state").select("id");
      if (gameStates) {
        for (const gs of gameStates) {
          await supabase
            .from("game_state")
            .update({ 
              current_turn_team_id: null, 
              is_dice_locked: true, 
              is_challenge_active: false, 
              total_revenue: 0 
            })
            .eq("id", gs.id);
        }
      }

      // Clear all news
      const { data: news } = await supabase.from("news_ticker").select("id");
      if (news) {
        for (const n of news) {
          await supabase.from("news_ticker").delete().eq("id", n.id);
        }
      }

      toast.success("รีเซ็ตระบบทั้งหมดสำเร็จ");
      fetchAllData();
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("เกิดข้อผิดพลาดในการรีเซ็ต");
    }
    
    setLoading(false);
  };

  // Filter logic
  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPlayers = players.filter(p =>
    p.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'GROW_PLUS': return 'bg-strategy-grow/20 text-strategy-grow';
      case 'SAFE_ACT': return 'bg-strategy-safe/20 text-strategy-safe';
      case 'PRO_CARE': return 'bg-strategy-care/20 text-strategy-care';
      default: return 'bg-muted';
    }
  };

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl font-display">Admin Database Portal</CardTitle>
            <p className="text-muted-foreground">กรุณาใส่รหัสผ่านเพื่อเข้าสู่ระบบ</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full">
              <Unlock className="w-4 h-4 mr-2" />
              เข้าสู่ระบบ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      {/* Header */}
      <header className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-display font-bold">Super Admin Portal</h1>
              <p className="text-muted-foreground">จัดการฐานข้อมูลระบบ</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="destructive" 
              onClick={handleGlobalReset}
              disabled={loading}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Global Reset
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsAuthenticated(false)}
            >
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="ค้นหา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            คำถาม
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            ทีม
          </TabsTrigger>
          <TabsTrigger value="players" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            ผู้เล่น
          </TabsTrigger>
        </TabsList>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-display font-bold">
              Challenge Questions ({filteredQuestions.length})
            </h2>
            <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetQuestionForm(); setShowAddQuestion(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มคำถาม
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>เพิ่มคำถามใหม่</DialogTitle>
                </DialogHeader>
                <QuestionForm 
                  form={questionForm}
                  setForm={setQuestionForm}
                  onSave={handleSaveQuestion}
                  loading={loading}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card className="glass-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Category</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead className="w-[80px]">Points</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuestions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <span className={cn("px-2 py-1 rounded text-xs font-medium", getCategoryColor(q.category))}>
                        {q.category.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{q.question}</TableCell>
                    <TableCell>{q.points}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Dialog open={editingQuestion?.id === q.id} onOpenChange={(open) => !open && setEditingQuestion(null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => openEditQuestion(q)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>แก้ไขคำถาม</DialogTitle>
                            </DialogHeader>
                            <QuestionForm 
                              form={questionForm}
                              setForm={setQuestionForm}
                              onSave={handleSaveQuestion}
                              loading={loading}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteQuestion(q.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          <h2 className="text-xl font-display font-bold">
            Teams Management ({teams.length})
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Card key={team.id} className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: team.color }}
                    />
                    <span>{team.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Tile */}
                  <div className="flex items-center justify-between">
                    <Label>Current Tile:</Label>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleUpdateTeam(team.id, { current_tile: Math.max(0, team.current_tile - 1) })}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-bold">{team.current_tile}</span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleUpdateTeam(team.id, { current_tile: team.current_tile + 1 })}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="space-y-2">
                    <ScoreAdjuster
                      label="Revenue (Grow+)"
                      score={team.revenue_score}
                      color="text-strategy-grow"
                      onAdjust={(amount) => handleAdjustScore(team.id, 'revenue', amount)}
                    />
                    <ScoreAdjuster
                      label="Safety (Safe Act)"
                      score={team.safety_score}
                      color="text-strategy-safe"
                      onAdjust={(amount) => handleAdjustScore(team.id, 'safety', amount)}
                    />
                    <ScoreAdjuster
                      label="Service (ProCare)"
                      score={team.service_score}
                      color="text-strategy-care"
                      onAdjust={(amount) => handleAdjustScore(team.id, 'service', amount)}
                    />
                  </div>

                  {/* Total */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Score:</span>
                      <span className="text-2xl font-display font-bold text-gradient">
                        {team.revenue_score + team.safety_score + team.service_score}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Players Tab */}
        <TabsContent value="players" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-display font-bold">
              Players ({filteredPlayers.length})
            </h2>
            <Button 
              variant="outline" 
              onClick={() => fetchPlayers()}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Card className="glass-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nickname</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.nickname}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: teams.find(t => t.id === player.team_id)?.color }}
                        />
                        {getTeamName(player.team_id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs",
                        player.role === 'CAPTAIN' ? 'bg-accent/20 text-accent' : 'bg-muted'
                      )}>
                        {player.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(player.created_at).toLocaleTimeString('th-TH')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Select onValueChange={(value) => handleReassignPlayer(player.id, value)}>
                          <SelectTrigger className="w-[100px] h-8">
                            <SelectValue placeholder="ย้ายทีม" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.filter(t => t.id !== player.team_id).map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeletePlayer(player.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPlayers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      ยังไม่มีผู้เล่นในระบบ
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components
function QuestionForm({ 
  form, 
  setForm, 
  onSave, 
  loading 
}: { 
  form: Record<string, unknown>; 
  setForm: (f: Record<string, unknown>) => void; 
  onSave: () => void; 
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GROW_PLUS">GROW PLUS</SelectItem>
              <SelectItem value="SAFE_ACT">SAFE ACT</SelectItem>
              <SelectItem value="PRO_CARE">PRO CARE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Points</Label>
          <Input 
            type="number" 
            value={form.points} 
            onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 10 })} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Question</Label>
        <Textarea 
          value={form.question} 
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Option A</Label>
          <Input value={form.optionA} onChange={(e) => setForm({ ...form, optionA: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Option B</Label>
          <Input value={form.optionB} onChange={(e) => setForm({ ...form, optionB: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Option C</Label>
          <Input value={form.optionC} onChange={(e) => setForm({ ...form, optionC: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Correct Answer</Label>
        <Select value={form.correct_answer} onValueChange={(v) => setForm({ ...form, correct_answer: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="B">B</SelectItem>
            <SelectItem value="C">C</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">ยกเลิก</Button>
        </DialogClose>
        <Button onClick={onSave} disabled={loading || !form.question}>
          บันทึก
        </Button>
      </DialogFooter>
    </div>
  );
}

function ScoreAdjuster({ 
  label, 
  score, 
  color, 
  onAdjust 
}: { 
  label: string; 
  score: number; 
  color: string; 
  onAdjust: (amount: number) => void;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}:</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => onAdjust(-10)}>
          -10
        </Button>
        <span className={cn("w-16 text-center font-bold", color)}>{score}</span>
        <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => onAdjust(10)}>
          +10
        </Button>
        <Button size="sm" variant="outline" className="h-6 px-2" onClick={() => onAdjust(50)}>
          +50
        </Button>
      </div>
    </div>
  );
}
