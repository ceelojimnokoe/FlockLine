/**
 * Hand-authored to match supabase/migrations/*.sql exactly. Once the
 * schema is live in a real project, prefer regenerating from the source
 * of truth:
 *
 *   npx supabase gen types typescript --project-id <project-id> > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      churches: {
        Row: {
          id: string;
          name: string;
          slug: string;
          phone: string | null;
          location: string | null;
          logo_url: string | null;
          plan: "starter" | "pro" | "business";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          phone?: string | null;
          location?: string | null;
          logo_url?: string | null;
          plan?: "starter" | "pro" | "business";
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          phone?: string | null;
          location?: string | null;
          logo_url?: string | null;
          plan?: "starter" | "pro" | "business";
          created_at?: string;
        };
        Relationships: [];
      };
      church_users: {
        Row: {
          id: string;
          user_id: string;
          church_id: string;
          role: "admin" | "pastor" | "volunteer";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          church_id: string;
          role?: "admin" | "pastor" | "volunteer";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          church_id?: string;
          role?: "admin" | "pastor" | "volunteer";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "church_users_church_id_fkey";
            columns: ["church_id"];
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
        ];
      };
      members: {
        Row: {
          id: string;
          church_id: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          gender: "male" | "female" | null;
          date_of_birth: string | null;
          address: string | null;
          joined_at: string;
          status: "first_timer" | "new_convert" | "member" | "inactive";
          photo_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          gender?: "male" | "female" | null;
          date_of_birth?: string | null;
          address?: string | null;
          joined_at?: string;
          status?: "first_timer" | "new_convert" | "member" | "inactive";
          photo_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          gender?: "male" | "female" | null;
          date_of_birth?: string | null;
          address?: string | null;
          joined_at?: string;
          status?: "first_timer" | "new_convert" | "member" | "inactive";
          photo_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "members_church_id_fkey";
            columns: ["church_id"];
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          id: string;
          church_id: string;
          name: string;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          name: string;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          name?: string;
          color?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tags_church_id_fkey";
            columns: ["church_id"];
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
        ];
      };
      member_tags: {
        Row: {
          member_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          member_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          member_id?: string;
          tag_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_tags_member_id_fkey";
            columns: ["member_id"];
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_tags_tag_id_fkey";
            columns: ["tag_id"];
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      follow_ups: {
        Row: {
          id: string;
          church_id: string;
          member_id: string;
          assigned_to: string | null;
          type: "visitor_welcome" | "new_convert" | "absentee" | "pastoral_care";
          status: "pending" | "in_progress" | "done";
          due_date: string | null;
          notes: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          member_id: string;
          assigned_to?: string | null;
          type: "visitor_welcome" | "new_convert" | "absentee" | "pastoral_care";
          status?: "pending" | "in_progress" | "done";
          due_date?: string | null;
          notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          member_id?: string;
          assigned_to?: string | null;
          type?: "visitor_welcome" | "new_convert" | "absentee" | "pastoral_care";
          status?: "pending" | "in_progress" | "done";
          due_date?: string | null;
          notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follow_ups_church_id_fkey";
            columns: ["church_id"];
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follow_ups_member_id_fkey";
            columns: ["member_id"];
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follow_ups_assigned_to_fkey";
            columns: ["assigned_to"];
            referencedRelation: "church_users";
            referencedColumns: ["id"];
          },
        ];
      };
      giving_funds: {
        Row: {
          id: string;
          church_id: string;
          name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "giving_funds_church_id_fkey";
            columns: ["church_id"];
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
        ];
      };
      giving_records: {
        Row: {
          id: string;
          church_id: string;
          member_id: string | null;
          fund_id: string;
          amount: number;
          currency: string;
          method: "paystack" | "momo_manual" | "cash";
          reference: string | null;
          recorded_by: string | null;
          given_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          member_id?: string | null;
          fund_id: string;
          amount: number;
          currency?: string;
          method: "paystack" | "momo_manual" | "cash";
          reference?: string | null;
          recorded_by?: string | null;
          given_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          member_id?: string | null;
          fund_id?: string;
          amount?: number;
          currency?: string;
          method?: "paystack" | "momo_manual" | "cash";
          reference?: string | null;
          recorded_by?: string | null;
          given_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "giving_records_church_id_fkey";
            columns: ["church_id"];
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "giving_records_member_id_fkey";
            columns: ["member_id"];
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "giving_records_fund_id_fkey";
            columns: ["fund_id"];
            referencedRelation: "giving_funds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "giving_records_recorded_by_fkey";
            columns: ["recorded_by"];
            referencedRelation: "church_users";
            referencedColumns: ["id"];
          },
        ];
      };
      member_status_events: {
        Row: {
          id: string;
          church_id: string;
          member_id: string;
          old_status: string | null;
          new_status: "first_timer" | "new_convert" | "member" | "inactive";
          changed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          member_id: string;
          old_status?: string | null;
          new_status: "first_timer" | "new_convert" | "member" | "inactive";
          changed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          member_id?: string;
          old_status?: string | null;
          new_status?: "first_timer" | "new_convert" | "member" | "inactive";
          changed_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_status_events_church_id_fkey";
            columns: ["church_id"];
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_status_events_member_id_fkey";
            columns: ["member_id"];
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_status_events_changed_by_fkey";
            columns: ["changed_by"];
            referencedRelation: "church_users";
            referencedColumns: ["id"];
          },
        ];
      };
      volunteer_teams: {
        Row: {
          id: string;
          church_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "volunteer_teams_church_id_fkey";
            columns: ["church_id"];
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          team_id: string;
          member_id: string;
          created_at: string;
        };
        Insert: {
          team_id: string;
          member_id: string;
          created_at?: string;
        };
        Update: {
          team_id?: string;
          member_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "volunteer_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_member_id_fkey";
            columns: ["member_id"];
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      rota_assignments: {
        Row: {
          id: string;
          team_id: string;
          service_date: string;
          member_id: string;
          role: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          service_date: string;
          member_id: string;
          role?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          service_date?: string;
          member_id?: string;
          role?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rota_assignments_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "volunteer_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rota_assignments_member_id_fkey";
            columns: ["member_id"];
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      message_templates: {
        Row: {
          id: string;
          church_id: string;
          follow_up_type: "visitor_welcome" | "new_convert" | "absentee" | "pastoral_care";
          name: string;
          body: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          church_id: string;
          follow_up_type: "visitor_welcome" | "new_convert" | "absentee" | "pastoral_care";
          name: string;
          body: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          church_id?: string;
          follow_up_type?: "visitor_welcome" | "new_convert" | "absentee" | "pastoral_care";
          name?: string;
          body?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_templates_church_id_fkey";
            columns: ["church_id"];
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_church_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_church_user_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      onboard_church: {
        Args: { p_name: string; p_phone: string; p_location: string };
        Returns: {
          id: string;
          name: string;
          slug: string;
          phone: string | null;
          location: string | null;
          logo_url: string | null;
          plan: "starter" | "pro" | "business";
          created_at: string;
        };
      };
      get_church_teammates: {
        Args: Record<PropertyKey, never>;
        Returns: { id: string; email: string; role: string }[];
      };
      get_public_church_by_slug: {
        Args: { p_slug: string };
        Returns: { id: string; name: string; logo_url: string | null }[];
      };
      get_public_giving_funds: {
        Args: { p_church_id: string };
        Returns: { id: string; name: string }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
