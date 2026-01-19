import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
}

const EMOJIS = ["👏", "❤️", "💪", "🎉", "🔥", "⭐"];

interface EmojiReactionsProps {
  teamId?: string;
  playerNickname?: string;
  showButtons?: boolean;
}

export function EmojiReactions({ teamId, playerNickname, showButtons = true }: EmojiReactionsProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  const addFloatingEmoji = useCallback((emoji: string) => {
    const id = Math.random().toString(36).slice(2);
    const x = Math.random() * 80 + 10; // 10-90% of container width
    
    setFloatingEmojis(prev => [...prev, { id, emoji, x }]);
    
    // Remove after animation completes
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("emoji-reactions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "emoji_reactions" },
        (payload) => {
          const { emoji } = payload.new as { emoji: string };
          addFloatingEmoji(emoji);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addFloatingEmoji]);

  const sendEmoji = async (emoji: string) => {
    await supabase.from("emoji_reactions").insert({
      team_id: teamId,
      emoji,
      player_nickname: playerNickname,
    });
  };

  return (
    <div className="relative">
      {/* Floating Emojis Container */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-0 floating-emoji text-5xl"
            style={{ left: `${item.x}%` }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Emoji Buttons */}
      {showButtons && (
        <div className="flex gap-2 justify-center flex-wrap">
          {EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              variant="outline"
              size="lg"
              onClick={() => sendEmoji(emoji)}
              className={cn(
                "text-3xl h-14 w-14 p-0 rounded-full",
                "bg-card/50 backdrop-blur-sm border-border/50",
                "hover:scale-125 hover:bg-accent/20 transition-all duration-200",
                "active:scale-95"
              )}
            >
              {emoji}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
