export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      challenge_questions: {
        Row: {
          category: Database["public"]["Enums"]["strategy_type"]
          correct_answer: string | null
          created_at: string
          id: string
          options: Json | null
          points: number
          question: string
        }
        Insert: {
          category: Database["public"]["Enums"]["strategy_type"]
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json | null
          points?: number
          question: string
        }
        Update: {
          category?: Database["public"]["Enums"]["strategy_type"]
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json | null
          points?: number
          question?: string
        }
        Relationships: []
      }
      emoji_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          player_nickname: string | null
          team_id: string | null
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          player_nickname?: string | null
          team_id?: string | null
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          player_nickname?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emoji_reactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_state: {
        Row: {
          challenge_end_time: string | null
          challenge_type: Database["public"]["Enums"]["strategy_type"] | null
          created_at: string
          current_turn_team_id: string | null
          id: string
          is_challenge_active: boolean
          is_dice_locked: boolean
          last_dice_value: number | null
          pending_challenge_game_type: string | null
          pending_challenge_team_id: string | null
          pending_challenge_title: string | null
          target_revenue: number
          total_revenue: number
          updated_at: string
        }
        Insert: {
          challenge_end_time?: string | null
          challenge_type?: Database["public"]["Enums"]["strategy_type"] | null
          created_at?: string
          current_turn_team_id?: string | null
          id?: string
          is_challenge_active?: boolean
          is_dice_locked?: boolean
          last_dice_value?: number | null
          pending_challenge_game_type?: string | null
          pending_challenge_team_id?: string | null
          pending_challenge_title?: string | null
          target_revenue?: number
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          challenge_end_time?: string | null
          challenge_type?: Database["public"]["Enums"]["strategy_type"] | null
          created_at?: string
          current_turn_team_id?: string | null
          id?: string
          is_challenge_active?: boolean
          is_dice_locked?: boolean
          last_dice_value?: number | null
          pending_challenge_game_type?: string | null
          pending_challenge_team_id?: string | null
          pending_challenge_title?: string | null
          target_revenue?: number
          total_revenue?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_state_current_turn_team_id_fkey"
            columns: ["current_turn_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_state_pending_challenge_team_id_fkey"
            columns: ["pending_challenge_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      grow_plus_games: {
        Row: {
          combo_multiplier: number
          created_at: string
          ends_at: string
          game_type: string
          id: string
          is_active: boolean
          started_at: string
          team_id: string | null
          total_score: number
        }
        Insert: {
          combo_multiplier?: number
          created_at?: string
          ends_at: string
          game_type: string
          id?: string
          is_active?: boolean
          started_at?: string
          team_id?: string | null
          total_score?: number
        }
        Update: {
          combo_multiplier?: number
          created_at?: string
          ends_at?: string
          game_type?: string
          id?: string
          is_active?: boolean
          started_at?: string
          team_id?: string | null
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "grow_plus_games_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      grow_plus_scores: {
        Row: {
          action_type: string
          created_at: string
          game_id: string | null
          id: string
          player_nickname: string
          score_value: number
          team_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          game_id?: string | null
          id?: string
          player_nickname: string
          score_value?: number
          team_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          game_id?: string | null
          id?: string
          player_nickname?: string
          score_value?: number
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grow_plus_scores_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "grow_plus_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grow_plus_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      news_ticker: {
        Row: {
          created_at: string
          id: string
          message: string
          team_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          team_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_ticker_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          id: string
          nickname: string
          role: Database["public"]["Enums"]["player_role"]
          session_id: string | null
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nickname: string
          role?: Database["public"]["Enums"]["player_role"]
          session_id?: string | null
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nickname?: string
          role?: Database["public"]["Enums"]["player_role"]
          session_id?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_care_games: {
        Row: {
          correct_votes: number
          created_at: string
          csi_score: number
          customers_helped: number
          ends_at: string
          game_type: string
          hearts_collected: number
          id: string
          is_active: boolean
          smile_taps: number
          started_at: string
          team_id: string | null
          total_votes: number
        }
        Insert: {
          correct_votes?: number
          created_at?: string
          csi_score?: number
          customers_helped?: number
          ends_at: string
          game_type: string
          hearts_collected?: number
          id?: string
          is_active?: boolean
          smile_taps?: number
          started_at?: string
          team_id?: string | null
          total_votes?: number
        }
        Update: {
          correct_votes?: number
          created_at?: string
          csi_score?: number
          customers_helped?: number
          ends_at?: string
          game_type?: string
          hearts_collected?: number
          id?: string
          is_active?: boolean
          smile_taps?: number
          started_at?: string
          team_id?: string | null
          total_votes?: number
        }
        Relationships: [
          {
            foreignKeyName: "pro_care_games_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_care_logs: {
        Row: {
          action_type: string
          created_at: string
          game_id: string | null
          id: string
          is_correct: boolean
          player_nickname: string
          score_value: number
          team_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          game_id?: string | null
          id?: string
          is_correct?: boolean
          player_nickname: string
          score_value?: number
          team_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          game_id?: string | null
          id?: string
          is_correct?: boolean
          player_nickname?: string
          score_value?: number
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pro_care_logs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "pro_care_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_care_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      safe_act_games: {
        Row: {
          combo_multiplier: number
          created_at: string
          ends_at: string
          game_type: string
          hazards_cleared: number
          id: string
          is_active: boolean
          shield_health: number
          started_at: string
          team_id: string | null
          total_correct: number
          total_wrong: number
        }
        Insert: {
          combo_multiplier?: number
          created_at?: string
          ends_at: string
          game_type: string
          hazards_cleared?: number
          id?: string
          is_active?: boolean
          shield_health?: number
          started_at?: string
          team_id?: string | null
          total_correct?: number
          total_wrong?: number
        }
        Update: {
          combo_multiplier?: number
          created_at?: string
          ends_at?: string
          game_type?: string
          hazards_cleared?: number
          id?: string
          is_active?: boolean
          shield_health?: number
          started_at?: string
          team_id?: string | null
          total_correct?: number
          total_wrong?: number
        }
        Relationships: [
          {
            foreignKeyName: "safe_act_games_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      safe_act_logs: {
        Row: {
          action_type: string
          created_at: string
          game_id: string | null
          id: string
          is_correct: boolean
          player_nickname: string
          score_value: number
          team_id: string | null
          zone_id: number | null
        }
        Insert: {
          action_type: string
          created_at?: string
          game_id?: string | null
          id?: string
          is_correct?: boolean
          player_nickname: string
          score_value?: number
          team_id?: string | null
          zone_id?: number | null
        }
        Update: {
          action_type?: string
          created_at?: string
          game_id?: string | null
          id?: string
          is_correct?: boolean
          player_nickname?: string
          score_value?: number
          team_id?: string | null
          zone_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "safe_act_logs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "safe_act_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safe_act_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string
          created_at: string
          current_tile: number
          id: string
          name: string
          revenue_score: number
          safety_score: number
          service_score: number
        }
        Insert: {
          color: string
          created_at?: string
          current_tile?: number
          id?: string
          name: string
          revenue_score?: number
          safety_score?: number
          service_score?: number
        }
        Update: {
          color?: string
          created_at?: string
          current_tile?: number
          id?: string
          name?: string
          revenue_score?: number
          safety_score?: number
          service_score?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      player_role: "CAPTAIN" | "CREW"
      strategy_type: "GROW_PLUS" | "SAFE_ACT" | "PRO_CARE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      player_role: ["CAPTAIN", "CREW"],
      strategy_type: ["GROW_PLUS", "SAFE_ACT", "PRO_CARE"],
    },
  },
} as const
