import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper } from "lucide-react";

interface NewsItem {
  id: string;
  message: string;
  created_at: string;
}

export function NewsTicker() {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      const { data } = await supabase
        .from("news_ticker")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) setNews(data);
    };
    fetchNews();

    const channel = supabase
      .channel("news-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "news_ticker" }, (payload) => {
        setNews((prev) => [payload.new as NewsItem, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (news.length === 0) {
    return (
      <div className="bg-primary/10 border-y border-primary/30 py-3 overflow-hidden">
        <div className="flex items-center gap-4 px-4">
          <Newspaper className="w-5 h-5 text-primary shrink-0" />
          <span className="text-muted-foreground">รอข่าวสารจากเกม...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary/10 border-y border-primary/30 py-3 overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 shrink-0 bg-primary/20 py-1 rounded-r-full">
          <Newspaper className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-primary text-sm">BREAKING</span>
        </div>

        <div className="overflow-hidden flex-1">
          <div
            className="flex gap-12 whitespace-nowrap animate-[ticker_90s_linear_infinite]"
            style={{ width: "max-content" }}
          >
            {[...news, ...news].map((item, index) => (
              <span key={`${item.id}-${index}`} className="text-foreground">
                🔔 {item.message}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
