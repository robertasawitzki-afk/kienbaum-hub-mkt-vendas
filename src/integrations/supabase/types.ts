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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aceites: {
        Row: {
          aceito_em: string
          id: string
          nome_signatario: string
          proposta_id: string
        }
        Insert: {
          aceito_em?: string
          id?: string
          nome_signatario: string
          proposta_id: string
        }
        Update: {
          aceito_em?: string
          id?: string
          nome_signatario?: string
          proposta_id?: string
        }
        Relationships: []
      }
      propostas: {
        Row: {
          codigo: string | null
          consultora: string | null
          criado_em: string
          dados_json: Json
          empresa: string | null
          html_gerado: string
          id: string
          slug: string
          status: string
        }
        Insert: {
          codigo?: string | null
          consultora?: string | null
          criado_em?: string
          dados_json: Json
          empresa?: string | null
          html_gerado: string
          id?: string
          slug: string
          status?: string
        }
        Update: {
          codigo?: string | null
          consultora?: string | null
          criado_em?: string
          dados_json?: Json
          empresa?: string | null
          html_gerado?: string
          id?: string
          slug?: string
          status?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          created_at: string
          details: Json
          id: string
          kind: string
          route: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          kind: string
          route?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          kind?: string
          route?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_outputs: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["ai_kind"]
          meta: Json
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["ai_kind"]
          meta?: Json
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["ai_kind"]
          meta?: Json
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          resource: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          resource: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          resource?: string
        }
        Relationships: []
      }
      materiais_files: {
        Row: {
          category: string
          created_at: string
          id: string
          mime_type: string | null
          product: string | null
          size_bytes: number | null
          storage_path: string
          title: string
          uploader_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          mime_type?: string | null
          product?: string | null
          size_bytes?: number | null
          storage_path: string
          title: string
          uploader_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          mime_type?: string | null
          product?: string | null
          size_bytes?: number | null
          storage_path?: string
          title?: string
          uploader_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      relationship_scores: {
        Row: {
          cliente: string
          created_at: string
          data: string
          id: string
          nota: number
          origem: string
          produto: string | null
          quem_atendeu: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          cliente: string
          created_at?: string
          data?: string
          id?: string
          nota: number
          origem?: string
          produto?: string | null
          quem_atendeu?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          cliente?: string
          created_at?: string
          data?: string
          id?: string
          nota?: number
          origem?: string
          produto?: string | null
          quem_atendeu?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_kind: "simulador" | "reuniao" | "deck" | "concorrencia" | "email" | "carteira" | "tecnicas"
      app_role:
        | "admin"
        | "cp"
        | "socio"
        | "head_produto"
        | "consultora"
        | "staff"
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
      ai_kind: ["simulador", "reuniao", "deck", "concorrencia", "email", "carteira", "tecnicas"],
      app_role: ["admin", "cp", "socio", "head_produto", "consultora", "staff"],
    },
  },
} as const
