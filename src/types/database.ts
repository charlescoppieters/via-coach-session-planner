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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      coaches: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string
          id: string
          name: string
          onboarding_completed: boolean
          position: string | null
          profile_picture: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          onboarding_completed?: boolean
          position?: string | null
          profile_picture?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          onboarding_completed?: boolean
          position?: string | null
          profile_picture?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coaching_rules: {
        Row: {
          category: string | null
          coach_id: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          team_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          coach_id: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          coach_id?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_rules_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_rules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          age_group: string
          coach_id: string
          content: string
          created_at: string
          duration: number
          id: string
          notes: string | null
          player_count: number
          session_date: string
          skill_level: string
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          age_group: string
          coach_id: string
          content: string
          created_at?: string
          duration: number
          id?: string
          notes?: string | null
          player_count: number
          session_date: string
          skill_level: string
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          age_group?: string
          coach_id?: string
          content?: string
          created_at?: string
          duration?: number
          id?: string
          notes?: string | null
          player_count?: number
          session_date?: string
          skill_level?: string
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      session_attendance: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          player_id: string
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          player_id: string
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          player_id?: string
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          age_group: string
          coach_id: string
          created_at: string
          gender: string | null
          id: string
          name: string
          player_count: number
          session_duration: number
          sessions_per_week: number
          skill_level: string
          updated_at: string
        }
        Insert: {
          age_group: string
          coach_id: string
          created_at?: string
          gender?: string | null
          id?: string
          name: string
          player_count: number
          session_duration: number
          sessions_per_week: number
          skill_level: string
          updated_at?: string
        }
        Update: {
          age_group?: string
          coach_id?: string
          created_at?: string
          gender?: string | null
          id?: string
          name?: string
          player_count?: number
          session_duration?: number
          sessions_per_week?: number
          skill_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          age: number | null
          coach_id: string
          created_at: string
          gender: string | null
          id: string
          name: string
          position: string | null
          target_1: string | null
          target_2: string | null
          target_3: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          coach_id: string
          created_at?: string
          gender?: string | null
          id?: string
          name: string
          position?: string | null
          target_1?: string | null
          target_2?: string | null
          target_3?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          coach_id?: string
          created_at?: string
          gender?: string | null
          id?: string
          name?: string
          position?: string | null
          target_1?: string | null
          target_2?: string | null
          target_3?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

// Type helpers for backwards compatibility
export type Coach = Database['public']['Tables']['coaches']['Row']
export type CoachInsert = Database['public']['Tables']['coaches']['Insert']
export type CoachUpdate = Database['public']['Tables']['coaches']['Update']

export type Team = Database['public']['Tables']['teams']['Row']
export type TeamInsert = Database['public']['Tables']['teams']['Insert']
export type TeamUpdate = Database['public']['Tables']['teams']['Update']

export type CoachingRule = Database['public']['Tables']['coaching_rules']['Row']
export type CoachingRuleInsert = Database['public']['Tables']['coaching_rules']['Insert']
export type CoachingRuleUpdate = Database['public']['Tables']['coaching_rules']['Update']

export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionInsert = Database['public']['Tables']['sessions']['Insert']
export type SessionUpdate = Database['public']['Tables']['sessions']['Update']

export type SessionAttendance = Database['public']['Tables']['session_attendance']['Row']
export type SessionAttendanceInsert = Database['public']['Tables']['session_attendance']['Insert']
export type SessionAttendanceUpdate = Database['public']['Tables']['session_attendance']['Update']

export type Player = Database['public']['Tables']['players']['Row']
export type PlayerInsert = Database['public']['Tables']['players']['Insert']
export type PlayerUpdate = Database['public']['Tables']['players']['Update']