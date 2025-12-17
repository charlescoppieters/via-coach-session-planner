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
      club_memberships: {
        Row: {
          club_id: string
          coach_id: string
          id: string
          is_head_coach: boolean
          joined_at: string
          role: string | null
        }
        Insert: {
          club_id: string
          coach_id: string
          id?: string
          is_head_coach?: boolean
          joined_at?: string
          role?: string | null
        }
        Update: {
          club_id?: string
          coach_id?: string
          id?: string
          is_head_coach?: boolean
          joined_at?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_memberships_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          code: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      methodology_templates: {
        Row: {
          content: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          logo_url: string | null
          name: string
          price_cents: number | null
          source: string
          template_type: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          logo_url?: string | null
          name: string
          price_cents?: number | null
          source: string
          template_type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          logo_url?: string | null
          name?: string
          price_cents?: number | null
          source?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          age: number | null
          club_id: string
          created_at: string
          gender: string | null
          id: string
          name: string
          position: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          club_id: string
          created_at?: string
          gender?: string | null
          id?: string
          name: string
          position?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          club_id?: string
          created_at?: string
          gender?: string | null
          id?: string
          name?: string
          position?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
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
      player_idps: {
        Row: {
          id: string
          player_id: string
          attribute_key: string
          priority: number
          notes: string | null
          started_at: string
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          attribute_key: string
          priority?: number
          notes?: string | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          attribute_key?: string
          priority?: number
          notes?: string | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_idps_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      playing_methodology: {
        Row: {
          club_id: string
          created_at: string
          created_by_coach_id: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by_coach_id: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by_coach_id?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playing_methodology_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playing_methodology_created_by_coach_id_fkey"
            columns: ["created_by_coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playing_methodology_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      position_suggestions: {
        Row: {
          club_id: string
          coach_id: string
          created_at: string
          description: string | null
          id: string
          reviewed_at: string | null
          status: string
          suggested_name: string
        }
        Insert: {
          club_id: string
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          suggested_name: string
        }
        Update: {
          club_id?: string
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          suggested_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_suggestions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_suggestions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      positional_profiles: {
        Row: {
          attributes: Json | null
          club_id: string
          created_at: string
          custom_position_name: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          position_key: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          club_id: string
          created_at?: string
          custom_position_name?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          position_key: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          club_id?: string
          created_at?: string
          custom_position_name?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          position_key?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positional_profiles_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positional_profiles_team_id_fkey"
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
            foreignKeyName: "session_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          age_group: string
          club_id: string
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
          club_id: string
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
          club_id?: string
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
            foreignKeyName: "sessions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
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
      system_defaults: {
        Row: {
          category: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      team_coaches: {
        Row: {
          assigned_at: string
          coach_id: string
          id: string
          team_id: string
        }
        Insert: {
          assigned_at?: string
          coach_id: string
          id?: string
          team_id: string
        }
        Update: {
          assigned_at?: string
          coach_id?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_coaches_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_coaches_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_facilities: {
        Row: {
          created_at: string
          custom_space: string | null
          equipment: Json | null
          id: string
          other_factors: string | null
          space_type: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_space?: string | null
          equipment?: Json | null
          id?: string
          other_factors?: string | null
          space_type?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_space?: string | null
          equipment?: Json | null
          id?: string
          other_factors?: string | null
          space_type?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_facilities_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          age_group: string
          club_id: string
          created_at: string
          created_by_coach_id: string
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
          club_id: string
          created_at?: string
          created_by_coach_id: string
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
          club_id?: string
          created_at?: string
          created_by_coach_id?: string
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
            foreignKeyName: "teams_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_created_by_coach_id_fkey"
            columns: ["created_by_coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      training_methodology: {
        Row: {
          club_id: string
          created_at: string
          created_by_coach_id: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by_coach_id: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by_coach_id?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_methodology_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_methodology_created_by_coach_id_fkey"
            columns: ["created_by_coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_methodology_team_id_fkey"
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
      generate_club_code: { Args: never; Returns: string }
      get_unique_club_code: { Args: never; Returns: string }
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
