import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  points: number;
}

interface QuestionChallenge {
  question: Question;
  answered: boolean;
  isCorrect: boolean;
  userAnswer: string | null;
}

interface ChallengeProps {
  teamId: string;
  onComplete: (totalScore: number) => void;
  onCancel: () => void;
}

export function QuestionChallenge({ teamId, onComplete, onCancel }: ChallengeProps) {
  const [challenges, setChallenges] = useState<QuestionChallenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Load 3 random questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from("challenge_questions")
          .select("*")
          .limit(100);

        if (error) throw error;

        // Shuffle and pick 3
        const shuffled = (data || []).sort(() => Math.random() - 0.5).slice(0, 3);

        const questionChallenges: QuestionChallenge[] = shuffled.map((q: Record<string, unknown>) => ({
          question: {
            id: q.id as string,
            question: q.question as string,
            options: (q.options as string[]) || [],
            correct_answer: q.correct_answer as string,
            points: (q.points as number) || 100000, // 0.1 MB default
          },
          answered: false,
          isCorrect: false,
          userAnswer: null,
        }));

        setChallenges(questionChallenges);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load questions:", err);
        setLoading(false);
      }
    };

    loadQuestions();
  }, []);

  const currentChallenge = challenges[currentIndex];
  const completedCount = challenges.filter((c) => c.answered).length;
  const correctCount = challenges.filter((c) => c.isCorrect).length;
  const totalScore = challenges.reduce(
    (sum, c) => sum + (c.isCorrect ? c.question.points : 0),
    0
  );

  const handleAnswer = async (answer: string) => {
    if (!currentChallenge) return;

    setSelectedAnswer(answer);
    const isCorrect = answer === currentChallenge.question.correct_answer;

    // Update challenge state
    setChallenges((prev) =>
      prev.map((c, i) =>
        i === currentIndex
          ? {
            ...c,
            answered: true,
            isCorrect,
            userAnswer: answer,
          }
          : c
      )
    );

    setShowResults(true);

    // Auto move to next after 2 seconds
    setTimeout(() => {
      if (currentIndex < challenges.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowResults(false);
        setSelectedAnswer(null);
      }
    }, 2000);
  };

  const handleFinish = async () => {
    // Add score to team
    try {
      const { data: team } = await supabase
        .from("teams")
        .select("revenue_score")
        .eq("id", teamId)
        .single();

      if (team) {
        await supabase
          .from("teams")
          .update({
            revenue_score: (team.revenue_score || 0) + totalScore,
          })
          .eq("id", teamId);
      }
    } catch (err) {
      console.error("Failed to update team score:", err);
    }

    onComplete(totalScore);
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <div className="animate-spin w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary mx-auto" />
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <p className="text-lg text-muted-foreground">No questions available</p>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top duration-700">
      {/* Header */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-2xl font-display font-bold text-gradient">
          💡 Question Challenge
        </h2>
        <p className="text-muted-foreground">Answer 3 random questions to earn revenue</p>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress: {completedCount}/3</span>
            <span className="text-accent font-bold">{correctCount} correct</span>
          </div>
          <Progress value={(completedCount / 3) * 100} className="h-2" />
        </div>
      </div>

      {/* Current Question */}
      {currentChallenge && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">
              Question {currentIndex + 1} of 3
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question */}
            <div className="text-xl font-semibold text-center py-4">
              {currentChallenge.question.question}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentChallenge.question.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => !showResults && handleAnswer(option)}
                  disabled={showResults}
                  className={cn(
                    "w-full p-4 rounded-lg border-2 transition-all font-medium",
                    showResults
                      ? option === currentChallenge.question.correct_answer
                        ? "border-green-500 bg-green-500/10 text-green-300"
                        : option === currentChallenge.userAnswer &&
                          !currentChallenge.isCorrect
                          ? "border-red-500 bg-red-500/10 text-red-300"
                          : "border-border opacity-50 cursor-not-allowed"
                      : "border-border hover:border-primary cursor-pointer hover:bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showResults && option === currentChallenge.question.correct_answer && (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    )}
                    {showResults &&
                      option === currentChallenge.userAnswer &&
                      !currentChallenge.isCorrect && (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                  </div>
                </button>
              ))}
            </div>

            {/* Result Feedback */}
            {showResults && (
              <div
                className={cn(
                  "p-4 rounded-lg text-center font-semibold",
                  currentChallenge.isCorrect
                    ? "bg-green-500/20 text-green-300 border border-green-500/50"
                    : "bg-red-500/20 text-red-300 border border-red-500/50"
                )}
              >
                {currentChallenge.isCorrect ? (
                  <>
                    <span>✅ Correct! </span>
                    <span className="text-accent font-display">
                      +{currentChallenge.question.points.toLocaleString()} THB
                    </span>
                  </>
                ) : (
                  <span>❌ Incorrect. The correct answer is:{" "}
                    {currentChallenge.question.correct_answer}</span>
                )}
              </div>
            )}

            {/* Next Button (appears after result) */}
            {showResults && currentIndex < challenges.length - 1 && (
              <Button
                onClick={() => {
                  setCurrentIndex(currentIndex + 1);
                  setShowResults(false);
                  setSelectedAnswer(null);
                }}
                className="w-full gap-2"
              >
                Next Question <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {completedCount === 3 && (
        <Card className="glass-card border-accent/50">
          <CardHeader>
            <CardTitle className="text-xl text-center text-gradient">
              🎉 Challenge Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-4xl font-display font-bold text-accent">
                {correctCount}/3
              </p>
              <p className="text-muted-foreground">questions answered correctly</p>
            </div>

            <div className="glass-card p-4 space-y-1">
              <p className="text-sm text-muted-foreground">Total Revenue Earned</p>
              <p className="text-3xl font-display font-bold text-strategy-grow">
                +{(totalScore / 1_000_000).toFixed(1)} MB
              </p>
              <p className="text-xs text-muted-foreground">
                ({totalScore.toLocaleString()} THB)
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleFinish} className="flex-1">
                Return to Main Stage
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
