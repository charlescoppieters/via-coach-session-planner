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
      club_invites: {
        Row: {
          club_id: string
          created_at: string
          created_by: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_invites_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      club_memberships: {
        Row: {
          club_id: string
          coach_id: string
          id: string
          joined_at: string
          role: string
        }
        Insert: {
          club_id: string
          coach_id: string
          id?: string
          joined_at?: string
          role?: string
        }
        Update: {
          club_id?: string
          coach_id?: string
          id?: string
          joined_at?: string
          role?: string
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
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
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
          target_1: string | null
          target_2: string | null
          target_3: string | null
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
          target_1?: string | null
          target_2?: string | null
          target_3?: string | null
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
          target_1?: string | null
          target_2?: string | null
          target_3?: string | null
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
          zones: Json | null
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
          zones?: Json | null
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
          zones?: Json | null
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
      session_block_assignments: {
        Row: {
          block_id: string
          created_at: string
          id: string
          position: number
          session_id: string
        }
        Insert: {
          block_id: string
          created_at?: string
          id?: string
          position: number
          session_id: string
        }
        Update: {
          block_id?: string
          created_at?: string
          id?: string
          position?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_block_assignments_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "session_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_block_assignments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_blocks: {
        Row: {
          club_id: string | null
          coaching_points: string | null
          created_at: string
          creator_id: string
          description: string | null
          diagram_data: Json | null
          duration: number | null
          id: string
          image_url: string | null
          is_public: boolean | null
          source: string | null
          title: string
          updated_at: string
        }
        Insert: {
          club_id?: string | null
          coaching_points?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          diagram_data?: Json | null
          duration?: number | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          source?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          club_id?: string | null
          coaching_points?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          diagram_data?: Json | null
          duration?: number | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          source?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_blocks_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_blocks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "coaches"
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
      team_training_rule_toggles: {
        Row: {
          id: string
          team_id: string
          training_rule_id: string
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          training_rule_id: string
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          training_rule_id?: string
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_training_rule_toggles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_training_rule_toggles_training_rule_id_fkey"
            columns: ["training_rule_id"]
            isOneToOne: false
            referencedRelation: "training_methodology"
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
      check_email_has_club: { Args: { check_email: string }; Returns: Json }
      copy_club_methodology_to_team: {
        Args: { p_team_id: string; p_club_id: string; p_coach_id: string }
        Returns: Json
      }
      create_club_with_membership: {
        Args: { club_logo_url?: string; club_name: string }
        Returns: Json
      }
      get_club_coaches: { Args: { target_club_id: string }; Returns: Json }
      get_invite_with_club: { Args: { invite_token: string }; Returns: Json }
      redeem_invite: { Args: { invite_token: string }; Returns: Json }
      remove_coach_from_club: {
        Args: { target_membership_id: string }
        Returns: Json
      }
      revert_team_playing_methodology: {
        Args: { p_team_id: string; p_club_id: string }
        Returns: Json
      }
      revert_team_positional_profiles: {
        Args: { p_team_id: string; p_club_id: string }
        Returns: Json
      }
      update_coach_role: {
        Args: { new_role: string; target_membership_id: string }
        Returns: Json
      }
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

// Convenience type aliases
export type Player = Tables<'players'>
export type PlayerInsert = TablesInsert<'players'>
export type PlayerUpdate = TablesUpdate<'players'>
export type Coach = Tables<'coaches'>
export type CoachInsert = TablesInsert<'coaches'>
export type CoachUpdate = TablesUpdate<'coaches'>
export type Club = Tables<'clubs'>
export type ClubMembership = Tables<'club_memberships'>
export type Team = Tables<'teams'>
export type TeamInsert = TablesInsert<'teams'>
export type TeamUpdate = TablesUpdate<'teams'>
export type TeamCoachInsert = TablesInsert<'team_coaches'>
export type Session = Tables<'sessions'>
export type SessionInsert = TablesInsert<'sessions'>
export type SessionUpdate = TablesUpdate<'sessions'>
export type SessionAttendance = Tables<'session_attendance'>
export type SessionAttendanceInsert = TablesInsert<'session_attendance'>
export type SessionAttendanceUpdate = TablesUpdate<'session_attendance'>
export type TeamFacility = Tables<'team_facilities'>
export type TeamFacilityInsert = TablesInsert<'team_facilities'>
export type TeamFacilityUpdate = TablesUpdate<'team_facilities'>
export type SystemDefault = Tables<'system_defaults'>
