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
      session_feedback: {
        Row: {
          id: string
          session_id: string
          coach_id: string
          team_feedback: string | null
          audio_url: string | null
          transcript: string | null
          overall_rating: number | null
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          coach_id: string
          team_feedback?: string | null
          audio_url?: string | null
          transcript?: string | null
          overall_rating?: number | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          coach_id?: string
          team_feedback?: string | null
          audio_url?: string | null
          transcript?: string | null
          overall_rating?: number | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_feedback_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      player_feedback_notes: {
        Row: {
          id: string
          session_feedback_id: string
          player_id: string
          note: string
          created_at: string
        }
        Insert: {
          id?: string
          session_feedback_id: string
          player_id: string
          note: string
          created_at?: string
        }
        Update: {
          id?: string
          session_feedback_id?: string
          player_id?: string
          note?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_feedback_notes_session_feedback_id_fkey"
            columns: ["session_feedback_id"]
            isOneToOne: false
            referencedRelation: "session_feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_feedback_notes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_insights: {
        Row: {
          id: string
          session_feedback_id: string
          player_id: string | null
          attribute_key: string | null
          sentiment: string | null
          confidence: number | null
          extracted_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_feedback_id: string
          player_id?: string | null
          attribute_key?: string | null
          sentiment?: string | null
          confidence?: number | null
          extracted_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_feedback_id?: string
          player_id?: string | null
          attribute_key?: string | null
          sentiment?: string | null
          confidence?: number | null
          extracted_text?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_insights_session_feedback_id_fkey"
            columns: ["session_feedback_id"]
            isOneToOne: false
            referencedRelation: "session_feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_insights_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
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
      update_player_idps: {
        Args: { p_player_id: string; p_new_idps: Json }
        Returns: undefined
      }
      generate_training_events: {
        Args: { p_session_id: string }
        Returns: number
      }
      get_accidental_idps: {
        Args: { p_player_id: string }
        Returns: { idp_id: string; attribute_key: string; duration_hours: number }[]
      }
      insert_feedback_insights: {
        Args: { p_session_feedback_id: string; p_insights: Json }
        Returns: number
      }
      get_team_training_summary: {
        Args: { p_team_id: string; p_start_date?: string | null; p_end_date?: string | null }
        Returns: {
          team_id: string
          sessions_completed: number
          total_training_minutes: number
          total_players: number
          active_idps: number
          unique_idp_attributes: number
          attributes_trained: number
          idp_coverage_rate: number
          avg_attendance_percentage: number
        }[]
      }
      get_team_attribute_breakdown: {
        Args: { p_team_id: string; p_start_date?: string | null; p_end_date?: string | null }
        Returns: {
          category: string
          category_display_name: string
          total_opportunities: number
          attribute_count: number
          attributes: Json
        }[]
      }
      get_team_idp_gaps: {
        Args: { p_team_id: string; p_start_date?: string | null; p_end_date?: string | null }
        Returns: {
          attribute_key: string
          attribute_name: string
          players_with_idp: number
          players_trained: number
          last_trained_date: string | null
          days_since_trained: number
          sessions_since_trained: number
          total_sessions: number
          player_ids: string[]
          player_names: string[]
          gap_status: string
          training_sessions: Array<{
            session_id: string
            session_name: string
            session_date: string
          }> | null
        }[]
      }
      get_team_training_trend: {
        Args: { p_team_id: string; p_weeks?: number }
        Returns: {
          week_start: string
          week_label: string
          sessions_count: number
          total_opportunities: number
          avg_attendance: number
        }[]
      }
      get_team_session_block_usage: {
        Args: { p_team_id: string; p_start_date?: string | null; p_end_date?: string | null; p_limit?: number }
        Returns: {
          block_id: string
          block_title: string
          usage_count: number
          total_training_weight: number
          attributes_trained: string[]
        }[]
      }
      get_team_player_matrix: {
        Args: { p_team_id: string; p_start_date?: string | null; p_end_date?: string | null }
        Returns: {
          player_id: string
          player_name: string
          position: string | null
          sessions_attended: number
          total_sessions: number
          attendance_percentage: number
          active_idp_count: number
          most_trained_idp: string | null
          most_trained_sessions: number
          mid_trained_idp: string | null
          mid_trained_sessions: number
          least_trained_idp: string | null
          least_trained_sessions: number
        }[]
      }
      get_player_comparison: {
        Args: { p_player_ids: string[]; p_start_date?: string | null; p_end_date?: string | null }
        Returns: {
          player_id: string
          player_name: string
          position: string | null
          sessions_attended: number
          total_sessions: number
          attendance_percentage: number
          total_opportunities: number
          idps: Json
        }[]
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
export type SessionFeedback = Tables<'session_feedback'>
export type SessionFeedbackInsert = TablesInsert<'session_feedback'>
export type SessionFeedbackUpdate = TablesUpdate<'session_feedback'>
export type PlayerFeedbackNote = Tables<'player_feedback_notes'>
export type PlayerFeedbackNoteInsert = TablesInsert<'player_feedback_notes'>
export type FeedbackInsight = Tables<'feedback_insights'>
export type FeedbackInsightInsert = TablesInsert<'feedback_insights'>
export type TeamFacility = Tables<'team_facilities'>
export type TeamFacilityInsert = TablesInsert<'team_facilities'>
export type TeamFacilityUpdate = TablesUpdate<'team_facilities'>
export type SystemDefault = Tables<'system_defaults'>
export type PlayerIDP = Tables<'player_idps'>
export type PlayerIDPInsert = TablesInsert<'player_idps'>
export type PlayerIDPUpdate = TablesUpdate<'player_idps'>

// ========================================
// Player Analytics Types
// ========================================

/**
 * Training event record - created when a player attends a session
 * that trains an attribute matching their active IDP
 */
export interface PlayerTrainingEvent {
  id: string
  player_id: string
  session_id: string
  attribute_key: string
  weight: number
  created_at: string
}

/**
 * IDP progress data from the player_idp_progress view
 * Aggregates training and feedback metrics per IDP
 */
export interface PlayerIDPProgress {
  idp_id: string
  player_id: string
  attribute_key: string
  attribute_name: string
  priority: number
  idp_notes: string | null
  started_at: string
  ended_at: string | null
  training_sessions: number
  total_training_weight: number
  positive_mentions: number
  negative_mentions: number
  neutral_mentions: number
  last_trained_date: string | null
}

/**
 * Attendance summary from the player_attendance_summary view
 */
export interface PlayerAttendanceSummary {
  player_id: string
  team_id: string
  club_id: string
  sessions_attended: number
  sessions_missed: number
  total_sessions: number
  attendance_percentage: number
}

/**
 * Block attribute with order type for session display
 */
export interface SessionBlockAttribute {
  key: string
  name: string
  is_player_idp: boolean // true if this attribute matches one of the player's active IDPs
}

/**
 * Block in a session with first/second order outcomes
 */
export interface SessionBlock {
  block_id: string
  block_title: string
  position: number
  first_order_outcomes: SessionBlockAttribute[]
  second_order_outcomes: SessionBlockAttribute[]
}

/**
 * Composite type for player session detail (used in Sessions tab)
 */
export interface PlayerSessionDetail {
  session_id: string
  title: string
  session_date: string
  duration: number
  attendance_status: 'present' | 'absent'
  team_feedback: string | null
  player_note: string | null
  training_events: Array<{
    attribute_key: string
    weight: number
  }>
  blocks: SessionBlock[]
}

// ========================================
// Playing Methodology Zone Types (v2)
// ========================================

/**
 * State for a single zone (either in-possession or out-of-possession)
 */
export interface ZoneState {
  name: string
  details: string
}

/**
 * A single zone in the playing methodology
 * Each zone has both in-possession and out-of-possession states
 */
export interface PlayingZone {
  id: string
  order: number
  name: string // Custom zone name (e.g., "Attacking Third", "Build-Up Zone")
  in_possession: ZoneState
  out_of_possession: ZoneState
}

/**
 * The full playing methodology zones structure
 * Stored in playing_methodology.zones JSONB column
 */
export interface PlayingMethodologyZones {
  zone_count: 3 | 4
  zones: PlayingZone[]
}

/**
 * Type guard to check if zones data is in the new v2 format
 */
export function isPlayingMethodologyZonesV2(zones: unknown): zones is PlayingMethodologyZones {
  if (!zones || typeof zones !== 'object') return false
  const z = zones as Record<string, unknown>
  return (
    (z.zone_count === 3 || z.zone_count === 4) &&
    Array.isArray(z.zones)
  )
}

// ========================================
// Positional Profile Attributes (v2)
// ========================================

/**
 * Attributes structure for positional profiles
 * Separates in-possession and out-of-possession attributes
 * Stored in positional_profiles.attributes JSONB column
 */
export interface PositionalProfileAttributes {
  in_possession: string[]      // up to 5 attribute keys
  out_of_possession: string[]  // up to 5 attribute keys
}

/**
 * Type guard to check if attributes data is in the new v2 format
 */
export function isPositionalProfileAttributesV2(attrs: unknown): attrs is PositionalProfileAttributes {
  if (!attrs || typeof attrs !== 'object') return false
  const a = attrs as Record<string, unknown>
  return (
    Array.isArray(a.in_possession) &&
    Array.isArray(a.out_of_possession)
  )
}

// ========================================
// Team Analytics Types
// ========================================

/**
 * Team training summary from get_team_training_summary RPC
 * Used for overview cards
 */
export interface TeamTrainingSummary {
  team_id: string
  sessions_completed: number
  total_training_minutes: number
  total_players: number
  active_idps: number
  unique_idp_attributes: number
  attributes_trained: number
  idp_coverage_rate: number
  avg_attendance_percentage: number
}

/**
 * IDP gap data from get_team_idp_gaps RPC
 * Shows which IDPs need attention based on recency
 */
export interface TeamIDPGap {
  attribute_key: string
  attribute_name: string
  players_with_idp: number
  players_trained: number
  last_trained_date: string | null
  days_since_trained: number
  sessions_since_trained: number
  total_sessions: number
  player_ids: string[]
  player_names: string[]
  gap_status: 'urgent' | 'due' | 'on_track'
  training_sessions: Array<{
    session_id: string
    session_name: string
    session_date: string
  }> | null
  priority_score: number // Weighted priority score 0-100
}

/**
 * Attribute breakdown by category from get_team_attribute_breakdown RPC
 * Used for the Four Corners training load visualization
 */
export interface TeamAttributeBreakdown {
  category: string
  category_display_name: string
  total_opportunities: number
  attribute_count: number
  attributes: Array<{
    key: string
    name: string
    opportunities: number
  }>
}

/**
 * Player matrix row from get_team_player_matrix RPC
 * Used for the player development table
 */
export interface TeamPlayerMatrixRow {
  player_id: string
  player_name: string
  position: string | null
  sessions_attended: number
  total_sessions: number
  attendance_percentage: number
  active_idp_count: number
  most_trained_idp: string | null
  most_trained_sessions: number
  mid_trained_idp: string | null
  mid_trained_sessions: number
  least_trained_idp: string | null
  least_trained_sessions: number
}

/**
 * Training trend point from get_team_training_trend RPC
 * Used for the weekly trend chart
 */
export interface TeamTrainingTrendPoint {
  week_start: string
  week_label: string
  sessions_count: number
  total_opportunities: number
  avg_attendance: number
}

/**
 * Block attribute with key and name
 */
export interface BlockAttribute {
  key: string
  name: string
}

/**
 * Impacted player info
 */
export interface ImpactedPlayer {
  player_id: string
  player_name: string
  position: string | null
}

/**
 * Session block usage from get_team_session_block_usage RPC
 * Shows most frequently used blocks with IDP impact
 */
export interface TeamSessionBlockUsage {
  block_id: string
  block_title: string
  usage_count: number
  active_idp_impact: number
  first_order_attributes: BlockAttribute[]
  second_order_attributes: BlockAttribute[]
  impacted_players: ImpactedPlayer[]
}

/**
 * Block recommendation from get_team_block_recommendations RPC
 * Shows blocks sorted by their impact on high-priority IDPs
 */
export interface TeamBlockRecommendation {
  block_id: string
  block_title: string
  priority_score: number // Sum of (IDP_score * relevance) for matching attributes
  idp_impact_count: number // Number of active IDPs this block trains
  first_order_attributes: BlockAttribute[]
  second_order_attributes: BlockAttribute[]
  impacted_players: ImpactedPlayer[]
  idp_breakdown: Array<{
    attribute_key: string
    attribute_name: string
    idp_score: number
    relevance: number
    players: Array<{
      name: string
      urgency_label: 'Underdeveloped' | 'Due for Training' | 'On Track'
    }>
  }>
}

// ============================================================
// PLAYER ANALYTICS TYPES
// Individual player analytics data structures
// ============================================================

/**
 * Player IDP with priority scoring
 * Enhanced version of PlayerIDPProgress with calculated priority score
 */
export interface PlayerIDPPriority {
  idp_id: string
  attribute_key: string
  attribute_name: string
  priority: number // 1-3 user-set priority
  priority_score: number // 0-100 calculated score
  days_since_trained: number
  last_trained_date: string | null
  training_sessions: number
  total_training_weight: number
  negative_mentions: number
  positive_mentions: number
  neutral_mentions: number
  gap_status: 'urgent' | 'due' | 'on_track'
  started_at: string
  ended_at: string | null
  idp_notes: string | null
}

/**
 * Feedback insight with extracted quote
 * Individual feedback mention about a player
 */
export interface PlayerFeedbackInsight {
  insight_id: string
  session_feedback_id: string
  session_id: string
  session_title: string
  session_date: string
  attribute_key: string | null
  attribute_name: string | null
  sentiment: 'positive' | 'negative' | 'neutral' | null
  confidence: number | null
  extracted_text: string | null
  created_at: string
}

/**
 * Block recommendation for individual player
 * Blocks filtered to player's active IDPs
 */
export interface PlayerBlockRecommendation {
  block_id: string
  block_title: string
  priority_score: number
  idp_impact_count: number
  first_order_attributes: Array<{ key: string; name: string }>
  second_order_attributes: Array<{ key: string; name: string }>
  idp_breakdown: Array<{
    attribute_key: string
    attribute_name: string
    idp_score: number
    relevance: number
  }>
}

/**
 * Training balance by category (Four Corners)
 * Shows distribution of training across attribute categories
 */
export interface PlayerTrainingBalance {
  category: string
  category_display_name: string
  total_opportunities: number
  percentage: number
  attribute_count: number
  attributes: Array<{
    key: string
    name: string
    opportunities: number
  }>
}

/**
 * Filters for feedback insights query
 */
export interface FeedbackFilters {
  attributeKey?: string | null
  sentiment?: 'positive' | 'negative' | 'neutral' | null
  startDate?: Date | null
  endDate?: Date | null
}

/**
 * Time period filter preset options
 */
export type TimePeriodPreset = '1w' | '1m' | '6w' | '12w' | 'all' | 'custom'

/**
 * Time period filter state
 */
export interface TimePeriodFilter {
  preset: TimePeriodPreset
  startDate: Date | null
  endDate: Date | null
}

/**
 * Helper to get date range from preset
 */
export function getDateRangeFromPreset(preset: TimePeriodPreset): { start: Date | null; end: Date | null } {
  const now = new Date()
  const end = now

  switch (preset) {
    case '1w':
      return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end }
    case '1m':
      return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end }
    case '6w':
      return { start: new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000), end }
    case '12w':
      return { start: new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000), end }
    case 'all':
      return { start: null, end: null }
    case 'custom':
      return { start: null, end: null } // Will be set manually
  }
}
